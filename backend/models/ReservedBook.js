const mongoose = require('mongoose');

const reservedBookSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  bookTitle: {
    type: String,
    required: true
  },
  reservedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: String
  },
  approvalDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }
}, { timestamps: true });

module.exports = mongoose.model('ReservedBook', reservedBookSchema);
