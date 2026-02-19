const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['login', 'logout', 'borrow', 'reserve', 'return', 'cancel_reservation', 'approve_transaction', 'reject_transaction', 'create_hold', 'cancel_hold', 'register', 'password_change', 'profile_update'],
    required: true
  },
  actionType: {
    type: String,
    enum: ['auth', 'transaction', 'account'],
    required: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  bookTitle: String,
  description: String,
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  ipAddress: String,
  userAgent: String,
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  formattedDate: {
    type: String,
    get: function() {
      if (this.timestamp) {
        return this.timestamp.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
      return '';
    }
  }
});

// Add a compound index for efficient filtering
logSchema.index({ userEmail: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);
