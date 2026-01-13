const mongoose = require('mongoose');

const ReturnRequestSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  bookTitle: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  condition: {
    type: String,
    enum: ['good', 'damaged', 'lost'],
    default: 'good'
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReturnRequest', ReturnRequestSchema);
