const mongoose = require('mongoose');

const bookCopySchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  copyNumber: {
    type: String,
    required: true,
    unique: true
  },
  sequence: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'on-loan', 'legacy-unassigned', 'retired'],
    required: true,
    default: 'available'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  borrowedBy: {
    type: String,
    default: null
  },
  borrowedAt: {
    type: Date,
    default: null
  },
  retiredAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

bookCopySchema.index({ bookId: 1, sequence: 1 }, { unique: true });
bookCopySchema.index({ bookId: 1, status: 1, sequence: 1 });

module.exports = mongoose.model('BookCopy', bookCopySchema);
