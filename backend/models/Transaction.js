const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['borrow', 'reserve'],
    required: true
  },  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired', 'pending', 'approved', 'rejected'],
    required: true
  },
  approvedBy: {
    type: String
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  returnDate: {
    type: Date
  },
  bookTitle: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
