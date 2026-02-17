const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Log = require('../models/Log');
const ReservedBook = require('../models/ReservedBook');
const PendingReservedBook = require('../models/PendingReservedBook');
const ReturnRequest = require('../models/ReturnRequest');
const {
  sendReservationPendingEmail,
  sendReservationApprovedEmail,
  sendReservationRejectedEmail,
  sendBorrowRequestSubmittedEmail,
  sendBorrowRequestApprovedEmail,
  sendBorrowRequestRejectedEmail,
  sendReturnRequestApprovedEmail,
  sendReturnRequestRejectedEmail
} = require('../utils/emailService');
const { notifyBookmarkUsersIfAvailable } = require('../utils/bookmarkNotificationManager');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's transactions
router.get('/user/:email', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userEmail: req.params.email,
      dismissed: { $ne: true },
      $or: [
        { status: { $in: ['active', 'completed'] } },
        { $and: [{ status: 'pending' }, { type: { $in: ['reserve', 'borrow'] } }] }
      ]
    }).sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Borrow a book
router.post('/borrow', async (req, res) => {
  try {
    const { bookId, userEmail } = req.body;
    console.log("/borrow", bookId, userEmail);
    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if there are available copies
    const availableStock = book.availableStock || book.stock || 0;
    if (availableStock <= 0) {
      return res.status(400).json({ message: 'Book is not available' });
    }

    // Create new transaction
    const transaction = new Transaction({
      bookId,
      userEmail,
      type: 'borrow',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      bookTitle: book.title
    });

    // Update book status - decrement available stock
    book.borrowedBy = userEmail;
    book.borrowedAt = new Date();
    book.availableStock = (book.availableStock || book.stock || 0) - 1;

    await Promise.all([
      transaction.save(),
      book.save(),
      new Log({
        userEmail,
        action: `Borrowed book: ${book.title}`
      }).save()
    ]);

    // PROCESS HOLDS: Mark ready hold as picked up and reindex queue
    try {
      const Hold = require('../models/Hold');
      
      // Look for a ready hold from this user for this book
      const readyHold = await Hold.findOne({
        bookId,
        userEmail,
        status: 'ready'
      });

      if (readyHold) {
        console.log(`✅ Found ready hold for user ${userEmail} on book ${book.title} - marking as picked up`);
        
        // Mark hold as picked up and expired
        readyHold.pickedUp = true;
        readyHold.pickedUpDate = new Date();
        readyHold.status = 'expired';
        await readyHold.save();

        // Reindex queue positions for remaining active holds
        const activeHolds = await Hold.find({
          bookId,
          status: 'active'
        }).sort({ holdDate: 1 });

        for (let i = 0; i < activeHolds.length; i++) {
          activeHolds[i].queuePosition = i + 1;
          await activeHolds[i].save();
        }

        console.log(`📊 Reindexed ${activeHolds.length} holds for book ${bookId}`);
      }
    } catch (holdError) {
      console.error('Error processing holds after borrow:', holdError);
      // Don't fail the borrow if hold processing fails
    }

    res.status(201).json({ message: 'Book borrowed successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reserve a book
router.post('/reserve', async (req, res) => {
  try {
    const { bookId, userEmail } = req.body;
    console.log("/reserve", bookId, userEmail);
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if book is already reserved by this user
    const existingReservation = await Transaction.findOne({
      bookId,
      userEmail, type: 'reserve',
      status: { $in: ['active', 'pending'] }
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'You have already reserved this book' });
    }
    const transaction = new Transaction({
      bookId,
      userEmail,
      type: 'reserve',
      status: 'pending', // Start as pending, waiting for admin approval
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for admin to approve
      bookTitle: book.title
    });
    
    // Save transaction and log immediately
    await Promise.all([
      transaction.save(),
      new Log({
        userEmail,
        action: `Reservation requested for book: ${book.title}`
      }).save()
    ]);

    // Send email and create pending reserved book in the background (non-blocking)
    try {
      const emailResult = await sendReservationPendingEmail(userEmail, book.title);
      console.log('📧 Reservation pending email sent to', userEmail, '- Result:', emailResult);
    } catch (emailErr) {
      console.error('❌ Error sending reservation pending email:', emailErr.message);
    }
    
    PendingReservedBook.create({
      bookId: book._id,
      userEmail,
      bookTitle: book.title,
      reservedAt: new Date(),
      transactionId: transaction._id
    }).catch(err => {
      console.error('Error creating pending reserved book:', err);
    });

    res.status(201).json({ message: 'Book reserved successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Return a book
router.post('/return/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const book = await Book.findById(transaction.bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.returnDate = new Date();

    // Update book - increment availableStock if it was borrowed
    if (transaction.type === 'borrow') {
      book.availableStock = (book.availableStock || 0) + 1;
    }
    book.borrowedBy = null;
    book.borrowedAt = null;

    await Promise.all([
      transaction.save(),
      book.save(),
      new Log({
        userEmail: transaction.userEmail,
        action: `Returned book: ${book.title}`
      }).save()
    ]);

    // PROCESS HOLDS: Check if there are any holds waiting for this book
    try {
      const Hold = require('../models/Hold');
      const { sendEmail } = require('../utils/emailService');
      
      console.log(`🔍 Checking for holds on book ${book._id} after return`);
      
      // Get first person in hold queue
      const firstHold = await Hold.findOne({
        bookId: book._id,
        status: 'active'
      }).sort({ queuePosition: 1 });

      if (firstHold) {
        console.log(`📋 Found hold! Processing hold for user ${firstHold.userEmail} on book ${book.title}`);
        
        // Mark hold as ready
        firstHold.status = 'ready';
        firstHold.readyPickupDate = new Date();
        console.log(`📝 Setting hold status to: ${firstHold.status}`);
        const savedHold = await firstHold.save();
        console.log(`✅ Hold saved successfully. New status: ${savedHold.status}`);

        // Send notification email using Resend
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2e7d32;">📚 Book Now Available!</h2>
            <p>Dear ${firstHold.userName},</p>
            <p>Great news! The book you placed a hold on is now available for borrowing:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Book Title:</strong> ${firstHold.bookTitle}</p>
              <p><strong>Hold Placed:</strong> ${new Date(firstHold.holdDate).toLocaleDateString()}</p>
              <p><strong>Available Since:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="color: #e65100;"><strong>⏰ You can borrow this book anytime. Your hold will expire in 7 days if you don't borrow it.</strong></p>
            </div>
            <p>Visit our library or use the app to borrow the book at your convenience.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Parañaledge Library System</p>
          </div>
        `;

        try {
          console.log(`📧 Sending hold-available email to ${firstHold.userEmail}`);
          const emailResult = await sendEmail({
            to: firstHold.userEmail,
            subject: `📚 Book Available to Borrow - ${firstHold.bookTitle}`,
            html: htmlContent
          });
          
          if (emailResult.error) {
            console.error('❌ Failed to send hold notification email:', emailResult.error);
          } else {
            firstHold.notificationSent = true;
            firstHold.notificationDate = new Date();
            await firstHold.save();
            console.log(`✅ Hold notification sent to ${firstHold.userEmail}. Message ID: ${emailResult.messageId}`);
          }
        } catch (emailErr) {
          console.error('❌ Error sending hold notification email:', emailErr.message);
        }
      } else {
        console.log(`ℹ️ No active holds for book ${book._id}`);
      }
    } catch (holdErr) {
      console.warn('⚠️ Hold processing failed (non-critical):', holdErr.message);
      // Don't fail the return if hold processing fails
    }

    // Notify bookmarked users if book is now available (async, non-blocking)
    notifyBookmarkUsersIfAvailable(book._id, book).catch(err => {
      console.error('Error notifying bookmark users:', err);
    });

    res.json({ message: 'Book returned successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel reservation
router.post('/cancel-reservation/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.type !== 'reserve') {
      return res.status(400).json({ message: 'This is not a reservation' });
    }

    transaction.status = 'cancelled';
    await Promise.all([
      transaction.save(),
      new Log({
        userEmail: transaction.userEmail,
        action: `Cancelled reservation for: ${transaction.bookTitle}`
      }).save()
    ]);

    res.json({ message: 'Reservation cancelled successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel pending borrow request
router.post('/cancel-pending/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'This is not a pending request' });
    }

    transaction.status = 'cancelled';
    await Promise.all([
      transaction.save(),
      new Log({
        userEmail: transaction.userEmail,
        action: `Cancelled pending ${transaction.type} request for: ${transaction.bookTitle}`
      }).save()
    ]);

    res.json({ message: 'Request cancelled successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending reservations for admin
router.get('/pending-reservations', async (req, res) => {
  try {
    const pendingReservations = await Transaction.find({
      type: 'reserve',
      status: 'pending'
    }).sort({ createdAt: -1 });
    res.json({ transactions: pendingReservations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending borrow requests for admin
router.get('/pending-borrows', async (req, res) => {
  try {
    const pendingBorrows = await Transaction.find({
      type: 'borrow',
      status: 'pending'
    }).sort({ createdAt: -1 });
    res.json({ transactions: pendingBorrows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/pending-requests', async (req, res) => {
  try {
    const pendingRequests = await Transaction.find({
      status: 'pending',
      $or: [
        { type: 'reserve' },
        { type: 'borrow' }
      ]
    }).sort({ createdAt: -1 });

    res.json({ transactions: pendingRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Approve a reservation
router.post('/approve-reservation/:id', async (req, res) => {
  try {
    const { adminEmail } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    console.log('Transaction details:', { 
      type: transaction.type, 
      status: transaction.status,
      id: transaction._id 
    });

    if (transaction.type !== 'reserve' || transaction.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Invalid transaction for approval',
        details: `Transaction type: ${transaction.type}, status: ${transaction.status}`
      });
    }

    // Check if book is still available
    const book = await Book.findById(transaction.bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.borrowedBy) {
      transaction.status = 'cancelled';
      await transaction.save();
      return res.status(400).json({ message: 'Book is no longer available' });
    }

    // Update transaction
    transaction.status = 'active';
    transaction.approvedBy = adminEmail;
    transaction.approvalDate = new Date();
    await transaction.save();

    // Move from PendingReservedBook to ReservedBook
    const pendingDoc = await PendingReservedBook.findOneAndDelete({ transactionId: transaction._id });
    await ReservedBook.create({
      bookId: transaction.bookId,
      userEmail: transaction.userEmail,
      bookTitle: transaction.bookTitle,
      reservedAt: transaction.createdAt,
      approvedBy: adminEmail,
      approvalDate: transaction.approvalDate,
      endDate: transaction.endDate,
      transactionId: transaction._id
    });

    // Create log entry and send notification
    await Promise.all([
      new Log({
        action: 'RESERVATION_APPROVED',
        userEmail: transaction.userEmail,
        adminEmail,
        bookId: transaction.bookId,
        bookTitle: transaction.bookTitle,
        details: `Reservation approved by ${adminEmail}`
      }).save()
    ]);

    // Send approval email notification to user
    try {
      const emailResult = await sendReservationApprovedEmail(
        transaction.userEmail,
        transaction.bookTitle,
        new Date(transaction.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );
      console.log('📧 Reservation approval email sent to', transaction.userEmail, '- Result:', emailResult);
    } catch (emailErr) {
      console.error('❌ Error sending reservation approval email:', emailErr.message);
    }

    res.json({ message: 'Reservation approved successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject a reservation
router.post('/reject-reservation/:id', async (req, res) => {
  try {
    const { adminEmail, rejectionReason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (transaction.type !== 'reserve' || transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid transaction for rejection' });
    }

    // Update transaction
    transaction.status = 'rejected';
    transaction.approvedBy = adminEmail;
    transaction.approvalDate = new Date();
    transaction.rejectionReason = rejectionReason;
    await transaction.save();

    await Promise.all([
      new Log({
        action: 'RESERVATION_REJECTED',
        userEmail: transaction.userEmail,
        adminEmail,
        bookId: transaction.bookId,
        bookTitle: transaction.bookTitle,
        details: `Reservation rejected by ${adminEmail}. Reason: ${rejectionReason}`
      }).save()
    ]);

    // Send email notification for rejected reservation
    try {
      const emailResult = await sendReservationRejectedEmail(
        transaction.userEmail,
        transaction.bookTitle,
        rejectionReason
      );
      console.log('📧 Reservation rejection email sent to', transaction.userEmail, '- Result:', emailResult);
    } catch (emailErr) {
      console.error('❌ Error sending reservation rejection email:', emailErr.message);
    }

    res.json({ message: 'Reservation rejected successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve a borrow request
router.post('/approve-borrow/:id', async (req, res) => {
  try {
    const { adminEmail } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }
    if (transaction.type !== 'borrow' || transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid transaction for approval' });
    }

    // Keep the original request date/time
    const originalRequestDate = transaction.startDate || transaction.createdAt;
    const approvalDate = new Date();
    const dueDate = new Date(approvalDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from approval

    // Update transaction to active
    transaction.status = 'active';
    transaction.approvedBy = adminEmail;
    transaction.approvalDate = approvalDate;
    transaction.endDate = dueDate;

    const book = await Book.findById(transaction.bookId);
    if (book) {
      // Check if there are available copies
      const currentStock = book.availableStock !== undefined && book.availableStock !== null ? book.availableStock : (book.stock || 0);
      console.log(`Before approve: Book ${book.title} availableStock=${book.availableStock}, stock=${book.stock}, current=${currentStock}`);
      
      if (currentStock <= 0) {
        return res.status(400).json({ message: 'No copies available' });
      }
      
      book.borrowedBy = transaction.userEmail;
      book.borrowedAt = new Date();
      // Decrement available stock
      book.availableStock = currentStock - 1;
      console.log(`After decrement: availableStock=${book.availableStock}`);
      
      await book.save();
      console.log(`Saved book: availableStock=${book.availableStock}`);
    }

    await transaction.save();

    // Send approval email notification to user with request date and due date
    try {
      const emailResult = await sendBorrowRequestApprovedEmail(transaction.userEmail, transaction.bookTitle, originalRequestDate, dueDate);
      console.log('📧 Borrow approval email sent to', transaction.userEmail, '- Result:', emailResult);
    } catch (emailErr) {
      console.error('❌ Error sending borrow approval email:', emailErr.message);
    }

    res.json({ message: 'Borrow request approved and book marked as borrowed.', transaction });
  } catch (err) {
    console.error('Error approving borrow:', err);
    res.status(500).json({ message: err.message });
  }
});

// Reject a borrow request
router.post('/reject-borrow/:id', async (req, res) => {
  try {
    const { adminEmail, rejectionReason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }
    if (transaction.type !== 'borrow' || transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Invalid transaction for rejection' });
    }
    
    // Preserve the original request date
    const originalRequestDate = transaction.startDate || transaction.createdAt;
    
    // Update transaction
    transaction.status = 'rejected';
    transaction.approvedBy = adminEmail;
    transaction.approvalDate = new Date();
    transaction.rejectionReason = rejectionReason;
    await transaction.save();

    // Send rejection email notification to user with request date
    try {
      const emailResult = await sendBorrowRequestRejectedEmail(transaction.userEmail, transaction.bookTitle, originalRequestDate, rejectionReason);
      console.log('📧 Borrow rejection email sent to', transaction.userEmail, '- Result:', emailResult);
    } catch (emailErr) {
      console.error('❌ Error sending borrow rejection email:', emailErr.message);
    }

    res.json({ message: 'Borrow request rejected successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all approved reservations
router.get('/approved-reservations', async (req, res) => {
  try {
    const approvedReservations = await Transaction.find({
      type: 'reserve',
      status: 'approved'
    }).sort({ createdAt: -1 });
    res.json({ transactions: approvedReservations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all reserved books (approved reservations)
router.get('/reserved-books', async (req, res) => {
  try {
    const reservedBooks = await ReservedBook.find().sort({ createdAt: -1 });
    res.json({ reservedBooks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send notifications to users with pending reservations
router.post('/reservation/notify-pending', async (req, res) => {
  try {
    const {
      sendEmails: shouldSendEmails = true,
      markNotificationSent = false
    } = req.body;

    // Find all pending reservations
    const pendingReservations = await Transaction.find({
      type: 'reserve',
      status: 'pending'
    });

    if (pendingReservations.length === 0) {
      return res.json({
        message: 'No pending reservations found',
        notificationsQueued: 0,
        userCount: 0
      });
    }

    // Group by user email
    const userReservationMap = {};
    pendingReservations.forEach(transaction => {
      if (!userReservationMap[transaction.userEmail]) {
        userReservationMap[transaction.userEmail] = [];
      }
      userReservationMap[transaction.userEmail].push(transaction);
    });

    const userEmails = Object.keys(userReservationMap);
    const { sendReservationPendingEmail } = require('../utils/emailService');

    let notificationResults = [];
    let transactionUpdates = [];

    for (const userEmail of userEmails) {
      const userReservations = userReservationMap[userEmail];

      try {
        let result;
        if (userReservations.length === 1) {
          // Single reservation
          const reservation = userReservations[0];

          if (shouldSendEmails) {
            result = await sendReservationPendingEmail(
              userEmail,
              reservation.bookTitle
            );
          } else {
            // Dry run
            result = { messageId: 'DRY_RUN_' + Date.now() };
          }

          if (markNotificationSent) {
            transactionUpdates.push({
              _id: reservation._id,
              notificationSent: true
            });
          }

          notificationResults.push({
            userEmail,
            bookTitle: reservation.bookTitle,
            status: result ? 'sent' : 'failed',
            isDryRun: !shouldSendEmails
          });
        } else {
          // Multiple reservations
          if (shouldSendEmails) {
            result = await sendReservationPendingEmail(
              userEmail,
              `${userReservations.length} books`
            );
          } else {
            result = { messageId: 'DRY_RUN_' + Date.now() };
          }

          userReservations.forEach(reservation => {
            if (markNotificationSent) {
              transactionUpdates.push({
                _id: reservation._id,
                notificationSent: true
              });
            }
          });

          notificationResults.push({
            userEmail,
            bookCount: userReservations.length,
            status: result ? 'sent' : 'failed',
            isDryRun: !shouldSendEmails
          });
        }
      } catch (err) {
        console.error(`Error sending email to ${userEmail}:`, err);
        notificationResults.push({
          userEmail,
          status: 'failed',
          error: err.message
        });
      }
    }

    // Update transactions if needed
    if (markNotificationSent) {
      for (const update of transactionUpdates) {
        await Transaction.findByIdAndUpdate(update._id, {
          notificationSent: true,
          notificationSentAt: new Date()
        });
      }
    }

    res.json({
      message: `Processed ${userEmails.length} users with pending reservations`,
      notificationsQueued: notificationResults.length,
      userCount: userEmails.length,
      results: notificationResults,
      isDryRun: !shouldSendEmails
    });
  } catch (err) {
    console.error('Error in reservation notification:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/borrow-request', async (req, res) => {
  try {
    const { bookId, userEmail } = req.body;
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const existing = await Transaction.findOne({
      bookId,
      userEmail,
      type: 'borrow',
      status: { $in: ['pending', 'active', 'approved'] }
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending or active borrow for this book.' });
    }

    // Check borrowing limit - max 3 active borrowed books
    const activeBorrowedCount = await Transaction.countDocuments({
      userEmail,
      type: 'borrow',
      status: 'active'
    });

    if (activeBorrowedCount >= 3) {
      return res.status(400).json({ message: 'You have reached the maximum borrowing limit of 3 books. Please return some books before borrowing more.' });
    }

    const requestDate = new Date();
    const transaction = new Transaction({
      bookId,
      userEmail,
      type: 'borrow',
      status: 'pending',
      startDate: requestDate,
      bookTitle: book.title
    });
    await transaction.save();
    await new Log({
      userEmail,
      action: `Requested to borrow book: ${book.title}`
    }).save();

    // Send email notification to user about their borrow request (async, don't wait)
    try {
      const emailResult = await sendBorrowRequestSubmittedEmail(userEmail, book.title, requestDate);
      console.log('📧 Borrow request email sent to', userEmail, '- Result:', emailResult);
    } catch (emailErr) {
      console.error('❌ Error sending borrow request email to', userEmail, ':', emailErr.message);
    }

    res.status(201).json({ message: 'Borrow request submitted and pending admin approval.', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all approved/active borrowed books for admin dashboard
router.get('/approved-books', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      type: 'borrow',
      status: 'active'
    }).sort({ createdAt: -1 });

    const books = await Promise.all(transactions.map(async (t) => {
      const book = await Book.findById(t.bookId);
      return {
        _id: t._id,
        bookId: t.bookId,
        title: t.bookTitle,
        userEmail: t.userEmail,
        borrowDate: t.startDate,
        returnDate: t.endDate,
        status: t.status,
        image: book ? book.image : null
      };
    }));
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============ RETURN REQUEST ENDPOINTS ============

// Submit a return request (user side)
router.post('/request-return/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const book = await Book.findById(transaction.bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { condition, notes } = req.body;

    // Check if return request already exists for this transaction
    const existingRequest = await ReturnRequest.findOne({
      transactionId: req.params.transactionId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Return request already submitted for this book' });
    }

    // Create return request
    const returnRequest = new ReturnRequest({
      transactionId: transaction._id,
      bookId: transaction.bookId,
      bookTitle: book.title,
      userEmail: transaction.userEmail,
      status: 'pending',
      condition: condition || 'good',
      notes: notes || null
    });

    await Promise.all([
      returnRequest.save(),
      new Log({
        userEmail: transaction.userEmail,
        action: `Submitted return request for book: ${book.title}`
      }).save()
    ]);

    res.status(201).json({ 
      message: 'Return request submitted successfully', 
      returnRequest 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all pending return requests (librarian view)
router.get('/return-requests', async (req, res) => {
  try {
    const returnRequests = await ReturnRequest.find({})
      .sort({ requestDate: -1 });
    
    res.json({ 
      requests: returnRequests,
      count: returnRequests.length 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all return requests with any status
router.get('/return-requests/all', async (req, res) => {
  try {
    const returnRequests = await ReturnRequest.find()
      .sort({ requestDate: -1 });
    
    res.json({ 
      requests: returnRequests,
      count: returnRequests.length 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's return requests
router.get('/return-requests/user/:email', async (req, res) => {
  try {
    const returnRequests = await ReturnRequest.find({ userEmail: req.params.email })
      .sort({ requestDate: -1 });
    
    res.json({ 
      requests: returnRequests,
      count: returnRequests.length 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve return request (librarian)
router.put('/return-requests/:requestId/approve', async (req, res) => {
  try {
    const { approvedBy } = req.body;

    const returnRequest = await ReturnRequest.findById(req.params.requestId);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    const transaction = await Transaction.findById(returnRequest.transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const book = await Book.findById(returnRequest.bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update return request
    returnRequest.status = 'approved';
    returnRequest.approvalDate = new Date();
    returnRequest.approvedBy = approvedBy || 'Librarian';

    // Update transaction
    transaction.status = 'completed';
    transaction.returnDate = new Date();

    // Update book - increment availableStock
    if (transaction.type === 'borrow') {
      book.availableStock = (book.availableStock || 0) + 1;
    }
    book.borrowedBy = null;
    book.borrowedAt = null;

    await Promise.all([
      returnRequest.save(),
      transaction.save(),
      book.save(),
      new Log({
        userEmail: transaction.userEmail,
        action: `Returned book: ${book.title} (Approved by ${approvedBy || 'Librarian'})`
      }).save()
    ]);

    // PROCESS HOLDS: Check if there are any holds waiting for this book
    try {
      const Hold = require('../models/Hold');
      const { sendEmail } = require('../utils/emailService');
      
      console.log(`🔍 Checking for holds on book ${book._id} after return approval`);
      
      // Get first person in hold queue
      const firstHold = await Hold.findOne({
        bookId: book._id,
        status: 'active'
      }).sort({ queuePosition: 1 });

      if (firstHold) {
        console.log(`📋 Found hold! Processing hold for user ${firstHold.userEmail} on book ${book.title}`);
        
        // Mark hold as ready
        firstHold.status = 'ready';
        firstHold.readyPickupDate = new Date();
        console.log(`📝 Setting hold status to: ${firstHold.status}`);
        const savedHold = await firstHold.save();
        console.log(`✅ Hold saved successfully. New status: ${savedHold.status}`);

        // Send notification email using Resend
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2e7d32;">📚 Book Now Available!</h2>
            <p>Dear ${firstHold.userName},</p>
            <p>Great news! The book you placed a hold on is now available for borrowing:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Book Title:</strong> ${firstHold.bookTitle}</p>
              <p><strong>Hold Placed:</strong> ${new Date(firstHold.holdDate).toLocaleDateString()}</p>
              <p><strong>Available Since:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="color: #e65100;"><strong>⏰ You can borrow this book anytime. Your hold will expire in 7 days if you don't borrow it.</strong></p>
            </div>
            <p>Visit our library or use the app to borrow the book at your convenience.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Parañaledge Library System</p>
          </div>
        `;

        try {
          console.log(`📧 Sending hold-ready email to ${firstHold.userEmail}`);
          const emailResult = await sendEmail({
            to: firstHold.userEmail,
            subject: `📚 Your Hold is Ready for Pickup - ${firstHold.bookTitle}`,
            html: htmlContent
          });
          
          if (emailResult.error) {
            console.error('❌ Failed to send hold notification email:', emailResult.error);
          } else {
            firstHold.notificationSent = true;
            firstHold.notificationDate = new Date();
            await firstHold.save();
            console.log(`✅ Hold notification sent to ${firstHold.userEmail}. Message ID: ${emailResult.messageId}`);
          }
        } catch (emailErr) {
          console.error('❌ Error sending hold notification email:', emailErr.message);
        }
      } else {
        console.log(`ℹ️ No active holds for book ${book._id}`);
      }
    } catch (holdErr) {
      console.warn('⚠️ Hold processing failed (non-critical):', holdErr.message);
      // Don't fail the return approval if hold processing fails
    }

    // SEND RETURN APPROVAL EMAIL TO USER
    try {
      console.log(`📧 Sending return approval email to ${transaction.userEmail}`);
      await sendReturnRequestApprovedEmail(
        transaction.userEmail,
        returnRequest.bookTitle,
        new Date()
      );
      console.log(`✅ Return approval email sent to ${transaction.userEmail}`);
    } catch (emailErr) {
      console.error('❌ Error sending return approval email:', emailErr.message);
      // Don't fail the return approval if email fails
    }

    res.json({ 
      message: 'Return request approved successfully', 
      returnRequest,
      transaction 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject return request (librarian)
router.put('/return-requests/:requestId/reject', async (req, res) => {
  try {
    const { rejectionReason, approvedBy } = req.body;

    const returnRequest = await ReturnRequest.findById(req.params.requestId);
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Update return request
    returnRequest.status = 'rejected';
    returnRequest.rejectionReason = rejectionReason || 'No reason provided';
    returnRequest.approvedBy = approvedBy || 'Librarian';

    await Promise.all([
      returnRequest.save(),
      new Log({
        userEmail: returnRequest.userEmail,
        action: `Return request rejected for book: ${returnRequest.bookTitle}. Reason: ${rejectionReason || 'No reason provided'}`
      }).save()
    ]);

    // SEND RETURN REJECTION EMAIL TO USER
    try {
      console.log(`📧 Sending return rejection email to ${returnRequest.userEmail}`);
      await sendReturnRequestRejectedEmail(
        returnRequest.userEmail,
        returnRequest.bookTitle,
        rejectionReason || 'No reason provided',
        new Date()
      );
      console.log(`✅ Return rejection email sent to ${returnRequest.userEmail}`);
    } catch (emailErr) {
      console.error('❌ Error sending return rejection email:', emailErr.message);
      // Don't fail the return rejection if email fails
    }

    res.json({ 
      message: 'Return request rejected successfully', 
      returnRequest 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all overdue books
router.get('/overdue/all', async (req, res) => {
  try {
    const now = new Date();
    
    // Find all active borrow transactions where endDate has passed
    const overdueTransactions = await Transaction.find({
      type: 'borrow',
      status: 'active',
      endDate: { $lt: now }
    }).sort({ endDate: 1 });

    const overdueData = overdueTransactions.map(transaction => {
      const daysOverdue = Math.floor((now - new Date(transaction.endDate)) / (1000 * 60 * 60 * 24));
      return {
        transactionId: transaction._id,
        bookTitle: transaction.bookTitle,
        userEmail: transaction.userEmail,
        dueDate: transaction.endDate,
        startDate: transaction.startDate,
        daysOverdue,
        reminderSent: transaction.reminderSent
      };
    });

    res.json({ 
      message: `Found ${overdueTransactions.length} overdue book(s)`,
      count: overdueTransactions.length,
      overdue: overdueData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get overdue books for a specific user
router.get('/overdue/user/:email', async (req, res) => {
  try {
    const now = new Date();
    const userEmail = req.params.email;
    
    // Find all active borrow transactions for user where endDate has passed
    const overdueTransactions = await Transaction.find({
      userEmail,
      type: 'borrow',
      status: 'active',
      endDate: { $lt: now }
    }).sort({ endDate: 1 });

    const overdueData = overdueTransactions.map(transaction => {
      const daysOverdue = Math.floor((now - new Date(transaction.endDate)) / (1000 * 60 * 60 * 24));
      return {
        _id: transaction._id,
        transactionId: transaction._id,
        bookId: transaction.bookId,
        bookTitle: transaction.bookTitle,
        endDate: transaction.endDate,
        dueDate: transaction.endDate,
        startDate: transaction.startDate,
        daysOverdue,
        reminderSent: transaction.reminderSent
      };
    });

    res.json({ 
      message: `User ${userEmail} has ${overdueTransactions.length} overdue book(s)`,
      count: overdueTransactions.length,
      overdue: overdueData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send overdue notification email to a specific user
router.post('/overdue/notify/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const now = new Date();
    const { 
      sendEmail: shouldSendEmail = true,
      markReminderSent = false 
    } = req.body;

    // Find all active borrow transactions for user where endDate has passed
    const overdueTransactions = await Transaction.find({
      userEmail,
      type: 'borrow',
      status: 'active',
      endDate: { $lt: now }
    }).sort({ endDate: 1 });

    if (overdueTransactions.length === 0) {
      return res.json({ 
        message: 'No overdue books found for this user',
        emailsSent: 0
      });
    }

    const { 
      sendOverdueNotificationEmail,
      sendOverdueReminderEmail
    } = require('../utils/emailService');

    let emailResults = [];

    if (overdueTransactions.length === 1 && shouldSendEmail) {
      // Single overdue book - send individual notification
      const transaction = overdueTransactions[0];
      const daysOverdue = Math.floor((now - new Date(transaction.endDate)) / (1000 * 60 * 60 * 24));
      
      const result = await sendOverdueNotificationEmail(
        userEmail,
        transaction.bookTitle,
        transaction.endDate,
        daysOverdue
      );
      emailResults.push(result);

      if (markReminderSent) {
        transaction.reminderSent = true;
        await transaction.save();
      }

      await new Log({
        userEmail,
        action: `Overdue notification email sent for book: ${transaction.bookTitle}`
      }).save();
    } else if (overdueTransactions.length > 1 && shouldSendEmail) {
      // Multiple overdue books - send bulk notification
      const booksData = overdueTransactions.map(transaction => {
        const daysOverdue = Math.floor((now - new Date(transaction.endDate)) / (1000 * 60 * 60 * 24));
        return {
          bookTitle: transaction.bookTitle,
          dueDate: transaction.endDate,
          daysOverdue
        };
      });

      const result = await sendOverdueReminderEmail(userEmail, booksData);
      emailResults.push(result);

      if (markReminderSent) {
        // Mark all transactions as reminder sent
        await Transaction.updateMany(
          { _id: { $in: overdueTransactions.map(t => t._id) } },
          { reminderSent: true }
        );
      }

      await new Log({
        userEmail,
        action: `Bulk overdue notification email sent for ${overdueTransactions.length} book(s)`
      }).save();
    }

    res.json({ 
      message: `Overdue notification sent to ${userEmail}`,
      overdueCount: overdueTransactions.length,
      emailsSent: shouldSendEmail ? 1 : 0,
      emailResults,
      books: overdueTransactions.map(t => ({
        title: t.bookTitle,
        dueDate: t.endDate
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Batch send overdue notifications to all users with overdue books
router.post('/overdue/notify-all', async (req, res) => {
  try {
    const now = new Date();
    const { 
      sendEmails: shouldSendEmails = true,
      markReminderSent = false,
      daysOverdueMinimum = 0 
    } = req.body;

    // Find all active borrow transactions where endDate has passed
    const overdueTransactions = await Transaction.find({
      type: 'borrow',
      status: 'active',
      endDate: { $lt: now }
    });

    // Group by user email
    const userOverdueMap = {};
    overdueTransactions.forEach(transaction => {
      const daysOverdue = Math.floor((now - new Date(transaction.endDate)) / (1000 * 60 * 60 * 24));
      
      // Skip if below minimum days overdue
      if (daysOverdue < daysOverdueMinimum) return;

      if (!userOverdueMap[transaction.userEmail]) {
        userOverdueMap[transaction.userEmail] = [];
      }
      userOverdueMap[transaction.userEmail].push({
        transaction,
        daysOverdue
      });
    });

    const userEmails = Object.keys(userOverdueMap);
    
    if (userEmails.length === 0) {
      return res.json({ 
        message: 'No overdue books found',
        notificationsQueued: 0,
        userCount: 0
      });
    }

    const { 
      sendOverdueNotificationEmail,
      sendOverdueReminderEmail
    } = require('../utils/emailService');

    let notificationResults = [];
    let transactionUpdates = [];

    for (const userEmail of userEmails) {
      const userOverdues = userOverdueMap[userEmail];
      
      try {
        if (userOverdues.length === 1) {
          // Single book - send individual notification
          const { transaction, daysOverdue } = userOverdues[0];
          
          let result;
          if (shouldSendEmails) {
            result = await sendOverdueNotificationEmail(
              userEmail,
              transaction.bookTitle,
              transaction.endDate,
              daysOverdue
            );
          } else {
            // Dry run - simulate success
            result = { messageId: 'DRY_RUN_' + Date.now() };
          }
          
          notificationResults.push({
            userEmail,
            success: !result.error,
            bookCount: 1,
            messageId: result.messageId
          });

          if (shouldSendEmails) {
            transactionUpdates.push({
              transactionId: transaction._id,
              reminderSent: markReminderSent
            });
          }
        } else if (userOverdues.length > 1) {
          // Multiple books - send bulk notification
          const booksData = userOverdues.map(({ transaction, daysOverdue }) => ({
            bookTitle: transaction.bookTitle,
            dueDate: transaction.endDate,
            daysOverdue
          }));

          let result;
          if (shouldSendEmails) {
            result = await sendOverdueReminderEmail(userEmail, booksData);
          } else {
            // Dry run - simulate success
            result = { messageId: 'DRY_RUN_' + Date.now() };
          }
          
          notificationResults.push({
            userEmail,
            success: !result.error,
            bookCount: userOverdues.length,
            messageId: result.messageId
          });

          if (shouldSendEmails) {
            userOverdues.forEach(({ transaction }) => {
              transactionUpdates.push({
                transactionId: transaction._id,
                reminderSent: markReminderSent
              });
            });
          }
        }

        await new Log({
          userEmail,
          action: `Overdue notification sent for ${userOverdues.length} book(s)`
        }).save();
      } catch (emailError) {
        console.error(`Error sending email to ${userEmail}:`, emailError.message);
        notificationResults.push({
          userEmail,
          success: false,
          bookCount: userOverdues.length,
          error: emailError.message
        });
      }
    }

    // Update transaction reminder flags
    if (markReminderSent) {
      for (const update of transactionUpdates) {
        await Transaction.findByIdAndUpdate(update.transactionId, { reminderSent: true });
      }
    }

    const successCount = notificationResults.filter(r => r.success).length;

    res.json({ 
      message: `Sent overdue notifications to ${successCount}/${notificationResults.length} users`,
      notificationsQueued: notificationResults.length,
      userCount: userEmails.length,
      overdueCount: overdueTransactions.length,
      results: notificationResults,
      remindersMarked: markReminderSent ? transactionUpdates.length : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin endpoint: Fix all transactions with missing endDate
router.post('/admin/fix-missing-dates', async (req, res) => {
  try {
    const { adminEmail } = req.body;
    
    // Verify admin email is provided
    if (!adminEmail) {
      return res.status(400).json({ message: 'Admin email is required' });
    }

    // Find all transactions without endDate
    const transactionsWithoutEndDate = await Transaction.find({
      $or: [
        { endDate: null },
        { endDate: { $exists: false } }
      ]
    });

    console.log(`Found ${transactionsWithoutEndDate.length} transactions without endDate`);

    if (transactionsWithoutEndDate.length === 0) {
      return res.json({ 
        message: 'No transactions need fixing',
        fixed: 0
      });
    }

    // Update all of them
    const updatePromises = transactionsWithoutEndDate.map(transaction => {
      // Set endDate to 7 days from startDate (or now if startDate doesn't exist)
      const baseDate = transaction.startDate || new Date();
      transaction.endDate = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return transaction.save();
    });

    await Promise.all(updatePromises);

    // Verify the fix
    const stillMissing = await Transaction.find({
      $or: [
        { endDate: null },
        { endDate: { $exists: false } }
      ]
    });

    res.json({ 
      message: `Fixed ${transactionsWithoutEndDate.length} transactions`,
      fixed: transactionsWithoutEndDate.length,
      stillMissing: stillMissing.length,
      success: stillMissing.length === 0
    });
  } catch (err) {
    console.error('Error fixing transactions:', err);
    res.status(500).json({ message: err.message });
  }
});

// Send pickup reminder emails to users whose pickup date is today
router.post('/reservation/pickup-reminder', async (req, res) => {
  try {
    const {
      sendEmails: shouldSendEmails = true,
      markNotificationSent = false
    } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Find all approved reservations where approvalDate (pickup date) is today
    const pickupReservations = await Transaction.find({
      type: 'reserve',
      status: 'approved',
      approvalDate: {
        $gte: today,
        $lt: tomorrowStart
      }
    });

    if (pickupReservations.length === 0) {
      return res.json({
        message: 'No reservations scheduled for pickup today',
        notificationsQueued: 0,
        userCount: 0
      });
    }

    // Group by user email
    const userPickupMap = {};
    pickupReservations.forEach(transaction => {
      if (!userPickupMap[transaction.userEmail]) {
        userPickupMap[transaction.userEmail] = [];
      }
      userPickupMap[transaction.userEmail].push(transaction);
    });

    const userEmails = Object.keys(userPickupMap);
    const { sendPickupReminderEmail } = require('../utils/emailService');

    let notificationResults = [];
    let transactionUpdates = [];

    for (const userEmail of userEmails) {
      const userPickups = userPickupMap[userEmail];

      try {
        let result;
        if (userPickups.length === 1) {
          // Single book pickup
          const reservation = userPickups[0];

          if (shouldSendEmails) {
            result = await sendPickupReminderEmail(
              userEmail,
              reservation.bookTitle,
              reservation.approvalDate
            );
          } else {
            // Dry run
            result = { messageId: 'DRY_RUN_' + Date.now() };
          }

          if (markNotificationSent) {
            transactionUpdates.push({
              _id: reservation._id,
              notificationSent: true
            });
          }

          notificationResults.push({
            userEmail,
            bookTitle: reservation.bookTitle,
            pickupDate: reservation.approvalDate,
            status: result ? 'sent' : 'failed',
            isDryRun: !shouldSendEmails
          });
        } else {
          // Multiple books pickup
          if (shouldSendEmails) {
            result = await sendPickupReminderEmail(
              userEmail,
              `${userPickups.length} books`,
              userPickups[0].approvalDate
            );
          } else {
            result = { messageId: 'DRY_RUN_' + Date.now() };
          }

          userPickups.forEach(reservation => {
            if (markNotificationSent) {
              transactionUpdates.push({
                _id: reservation._id,
                notificationSent: true
              });
            }
          });

          notificationResults.push({
            userEmail,
            bookCount: userPickups.length,
            pickupDate: userPickups[0].approvalDate,
            status: result ? 'sent' : 'failed',
            isDryRun: !shouldSendEmails
          });
        }
      } catch (err) {
        console.error(`Error sending pickup reminder to ${userEmail}:`, err);
        notificationResults.push({
          userEmail,
          status: 'failed',
          error: err.message
        });
      }
    }

    // Update transactions if needed
    if (markNotificationSent) {
      for (const update of transactionUpdates) {
        await Transaction.findByIdAndUpdate(update._id, {
          notificationSent: true,
          notificationSentAt: new Date()
        });
      }
    }

    res.json({
      message: `Sent pickup reminders to ${userEmails.length} users for today's pickups`,
      notificationsQueued: notificationResults.length,
      userCount: userEmails.length,
      results: notificationResults,
      isDryRun: !shouldSendEmails
    });
  } catch (err) {
    console.error('Error in pickup reminder notification:', err);
    res.status(500).json({ message: err.message });
  }
});

// Dismiss a notification
router.post('/:id/dismiss', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { dismissed: true },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Notification dismissed successfully', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get book transaction history (who borrowed and reserved it)
router.get('/book-history/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Fetch all transactions for this book, sorted by date
    const transactions = await Transaction.find({ bookId }).sort({ createdAt: -1 });
    
    if (!transactions) {
      return res.status(404).json({ message: 'No history found for this book' });
    }

    // Format the response with details about borrows and reserves
    const borrows = transactions.filter(t => t.type === 'borrow');
    const reserves = transactions.filter(t => t.type === 'reserve');

    res.json({
      bookId,
      totalTransactions: transactions.length,
      totalBorrows: borrows.length,
      totalReserves: reserves.length,
      transactions,
      borrows,
      reserves
    });
  } catch (err) {
    console.error('Error fetching book history:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

