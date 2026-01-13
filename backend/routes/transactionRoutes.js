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
  sendReservationRejectedEmail
} = require('../utils/emailService');

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
    sendReservationPendingEmail(userEmail, book.title).catch(err => {
      console.error('Error sending reservation email:', err);
    });
    
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
      }).save(),
      sendReservationApprovedEmail(
        transaction.userEmail,
        transaction.bookTitle,
        new Date(transaction.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      )
    ]);

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
      }).save(),
      sendReservationRejectedEmail(
        transaction.userEmail,
        transaction.bookTitle,
        rejectionReason
      )
    ]);

    // Send email notification for rejected reservation
    sendReservationRejectedEmail(transaction.userEmail, transaction.title, rejectionReason);

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

    // Update transaction to active
    transaction.status = 'active';
    transaction.approvedBy = adminEmail;
    transaction.approvalDate = new Date();
    transaction.startDate = new Date();
    transaction.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

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
    // Update transaction
    transaction.status = 'rejected';
    transaction.approvedBy = adminEmail;
    transaction.approvalDate = new Date();
    transaction.rejectionReason = rejectionReason;
    await transaction.save();
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
    const transaction = new Transaction({
      bookId,
      userEmail,
      type: 'borrow',
      status: 'pending',
      startDate: new Date(),
      bookTitle: book.title
    });
    await transaction.save();
    await new Log({
      userEmail,
      action: `Requested to borrow book: ${book.title}`
    }).save();
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
    const returnRequests = await ReturnRequest.find({ status: 'pending' })
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

    res.json({ 
      message: 'Return request rejected successfully', 
      returnRequest 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
