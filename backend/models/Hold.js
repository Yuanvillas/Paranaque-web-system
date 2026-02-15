const mongoose = require('mongoose');

const holdSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String
  },
  bookTitle: {
    type: String,
    required: true
  },
  position: {
    type: Number,
    default: 0
  },
  queuePosition: {
    type: Number,
    default: 1
  },
  holdDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: function() {
      // Hold expires after 14 days
      const date = new Date();
      date.setDate(date.getDate() + 14);
      return date;
    }
  },
  status: {
    type: String,
    enum: ['active', 'ready', 'expired', 'cancelled'],
    default: 'active'
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationDate: {
    type: Date
  },
  readyPickupDate: {
    type: Date
  },
  pickedUp: {
    type: Boolean,
    default: false
  },
  pickedUpDate: {
    type: Date
  },
  cancelledDate: {
    type: Date
  },
  cancelledReason: {
    type: String
  }
}, { timestamps: true });

// Index for faster queries
holdSchema.index({ bookId: 1, status: 1 });
holdSchema.index({ userEmail: 1, status: 1 });
holdSchema.index({ expiryDate: 1 });
holdSchema.index({ queuePosition: 1 });

// Auto-increment queue position within a book's hold queue
holdSchema.pre('save', async function(next) {
  if (this.isNew && !this.queuePosition) {
    try {
      // Count how many active holds exist for this book
      const count = await mongoose.model('Hold').countDocuments({
        bookId: this.bookId,
        status: 'active'
      });
      this.queuePosition = count + 1;
    } catch (err) {
      console.error('Error calculating queue position:', err);
      this.queuePosition = 1;
    }
  }
  next();
});

module.exports = mongoose.model('Hold', holdSchema);
