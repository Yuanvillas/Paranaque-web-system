const express = require('express');
const router = express.Router();
const Hold = require('../models/Hold');
const Book = require('../models/Book');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Initialize email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Create a new hold
router.post('/place', async (req, res) => {
  try {
    const { bookId, userEmail } = req.body;

    if (!bookId || !userEmail) {
      return res.status(400).json({ error: 'Book ID and user email are required' });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if user already has a hold on this book
    const existingHold = await Hold.findOne({
      bookId,
      userEmail,
      status: { $in: ['active', 'ready'] }
    });

    if (existingHold) {
      return res.status(409).json({ 
        error: 'You already have a hold on this book',
        position: existingHold.queuePosition
      });
    }

    // Check if user already borrowed this book
    const Transaction = require('../models/Transaction');
    const activeBorrow = await Transaction.findOne({
      bookId,
      userEmail,
      type: 'borrow',
      status: { $in: ['active', 'approved', 'borrowed'] }
    });

    if (activeBorrow) {
      return res.status(409).json({ 
        error: 'You cannot place a hold on a book you already borrowed. Return the book first.',
        borrowDate: activeBorrow.startDate,
        dueDate: activeBorrow.dueDate
      });
    }

    // Get user info for email field
    const user = await User.findOne({ email: userEmail });
    const userName = user ? user.firstName + ' ' + user.lastName : 'User';

    // Create new hold
    const newHold = new Hold({
      bookId,
      userEmail,
      userName,
      bookTitle: book.title
    });

    await newHold.save();

    console.log(`✅ Hold created - User: ${userEmail}, Book: ${book.title}, Queue Position: ${newHold.queuePosition}`);

    res.status(201).json({
      message: 'Hold placed successfully!',
      hold: {
        _id: newHold._id,
        queuePosition: newHold.queuePosition,
        holdDate: newHold.holdDate,
        expiryDate: newHold.expiryDate
      }
    });
  } catch (error) {
    console.error('Error placing hold:', error);
    res.status(500).json({ error: 'Failed to place hold: ' + error.message });
  }
});

// Get all holds for a user
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const status = req.query.status || null;

    let query = { userEmail: email };
    if (status) {
      query.status = status;
    }

    const holds = await Hold.find(query)
      .populate('bookId', 'title author category image')
      .sort({ queuePosition: 1 });

    res.json({
      holds,
      count: holds.length
    });
  } catch (error) {
    console.error('Error fetching user holds:', error);
    res.status(500).json({ error: 'Failed to fetch holds: ' + error.message });
  }
});

// Get hold queue for a specific book
router.get('/book/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    const queue = await Hold.find({
      bookId,
      status: 'active'
    }).sort({ queuePosition: 1 });

    res.json({
      bookId,
      queueLength: queue.length,
      queue
    });
  } catch (error) {
    console.error('Error fetching book hold queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue: ' + error.message });
  }
});

// Get user's position in queue for a specific book
router.get('/position/:bookId/:email', async (req, res) => {
  try {
    const { bookId, email } = req.params;

    const hold = await Hold.findOne({
      bookId,
      userEmail: email,
      status: 'active'
    });

    if (!hold) {
      return res.status(404).json({ error: 'Hold not found' });
    }

    res.json({
      queuePosition: hold.queuePosition,
      totalQueue: await Hold.countDocuments({ bookId, status: 'active' }),
      holdId: hold._id
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    res.status(500).json({ error: 'Failed to fetch position: ' + error.message });
  }
});

// Cancel a hold
router.post('/cancel/:holdId', async (req, res) => {
  try {
    const { holdId } = req.params;
    const { reason } = req.body;

    const hold = await Hold.findById(holdId);
    if (!hold) {
      return res.status(404).json({ error: 'Hold not found' });
    }

    hold.status = 'cancelled';
    hold.cancelledDate = new Date();
    hold.cancelledReason = reason || 'User cancelled';

    await hold.save();

    // Reindex remaining queue positions
    await reindexHoldQueue(hold.bookId);

    console.log(`📋 Hold cancelled - User: ${hold.userEmail}, Book: ${hold.bookTitle}`);

    res.json({ message: 'Hold cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling hold:', error);
    res.status(500).json({ error: 'Failed to cancel hold: ' + error.message });
  }
});

// When a book is returned/becomes available, check holds and notify
router.post('/process-available/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    // Get first person in hold queue
    const firstHold = await Hold.findOne({
      bookId,
      status: 'active'
    }).sort({ queuePosition: 1 });

    if (!firstHold) {
      return res.json({ message: 'No holds for this book' });
    }

    // Mark hold as ready
    firstHold.status = 'ready';
    firstHold.readyPickupDate = new Date();
    await firstHold.save();

    // Send notification email
    await sendHoldNotification(firstHold);

    console.log(`📬 Notification sent to ${firstHold.userEmail} for book: ${firstHold.bookTitle}`);

    res.json({
      message: 'Hold processed and user notified',
      hold: firstHold
    });
  } catch (error) {
    console.error('Error processing hold:', error);
    res.status(500).json({ error: 'Failed to process hold: ' + error.message });
  }
});

// Mark hold as picked up
router.post('/pickup/:holdId', async (req, res) => {
  try {
    const { holdId } = req.params;

    const hold = await Hold.findById(holdId);
    if (!hold) {
      return res.status(404).json({ error: 'Hold not found' });
    }

    hold.pickedUp = true;
    hold.pickedUpDate = new Date();
    hold.status = 'expired'; // Mark as complete after pickup

    await hold.save();

    // Reindex queue for this book
    await reindexHoldQueue(hold.bookId);

    console.log(`✅ Hold picked up - User: ${hold.userEmail}, Book: ${hold.bookTitle}`);

    res.json({ message: 'Hold marked as picked up' });
  } catch (error) {
    console.error('Error marking hold as picked up:', error);
    res.status(500).json({ error: 'Failed to mark pickup: ' + error.message });
  }
});

// Clean up expired holds (admin endpoint)
router.post('/cleanup-expired', async (req, res) => {
  try {
    const now = new Date();

    const result = await Hold.updateMany(
      {
        expiryDate: { $lt: now },
        status: { $in: ['active', 'ready'] }
      },
      {
        status: 'expired',
        cancelledDate: now,
        cancelledReason: 'Hold expired'
      }
    );

    console.log(`🧹 Cleaned up ${result.modifiedCount} expired holds`);

    res.json({
      message: `Cleaned up ${result.modifiedCount} expired holds`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error cleaning up holds:', error);
    res.status(500).json({ error: 'Failed to cleanup: ' + error.message });
  }
});

// Get all holds for admin
router.get('/admin/all', async (req, res) => {
  try {
    const status = req.query.status || null;

    let query = {};
    if (status) {
      query.status = status;
    }

    const holds = await Hold.find(query)
      .populate('bookId', 'title author category')
      .sort({ queuePosition: 1 });

    res.json({
      holds,
      count: holds.length
    });
  } catch (error) {
    console.error('Error fetching admin holds:', error);
    res.status(500).json({ error: 'Failed to fetch holds: ' + error.message });
  }
});

// Helper function to send notification email
async function sendHoldNotification(hold) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: hold.userEmail,
      subject: `📚 Your Hold is Ready for Pickup - ${hold.bookTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">📚 Your Book Hold is Ready!</h2>
          <p>Dear ${hold.userName},</p>
          <p>Great news! The book you placed a hold on is now available:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Book Title:</strong> ${hold.bookTitle}</p>
            <p><strong>Hold Placed:</strong> ${new Date(hold.holdDate).toLocaleDateString()}</p>
            <p><strong>Ready for Pickup:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="color: #e65100;"><strong>⏰ Please pick up within 7 days or your hold will expire.</strong></p>
          </div>
          <p>Please visit our library to pick up your book. If you have any questions, feel free to contact us.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Parañaledge Library System</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    // Update notification tracking
    hold.notificationSent = true;
    hold.notificationDate = new Date();
    await hold.save();

  } catch (error) {
    console.error('Error sending notification email:', error);
    // Don't fail the entire process if email fails
  }
}

// Helper function to reindex queue positions
async function reindexHoldQueue(bookId) {
  try {
    const activeHolds = await Hold.find({
      bookId,
      status: 'active'
    }).sort({ holdDate: 1 });

    for (let i = 0; i < activeHolds.length; i++) {
      activeHolds[i].queuePosition = i + 1;
      await activeHolds[i].save();
    }

    console.log(`📊 Reindexed ${activeHolds.length} holds for book ${bookId}`);
  } catch (error) {
    console.error('Error reindexing queue:', error);
  }
}

module.exports = router;
