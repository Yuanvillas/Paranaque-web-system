// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true // Removes extra whitespace
  },
  year: {
    type: Number,
    required: true,
    min: 1000, // Basic validation
    max: new Date().getFullYear() + 10
  },
  image: {
    type: String,
    default: null
  },
  archived: {
    type: Boolean,
    default: false
  }, stock: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  availableStock: {
    type: Number,
    default: function () {
      return this.stock;
    }
  },
  reservedAt: {
    type: Date,
    default: null
  },
  reservedBy: {
    type: String,
    default: null
  },
  reserveUntil: {
    type: Date,
    default: null
  },
  borrowedAt: {
    type: Date,
    default: null
  },
  author: {
    type: String,
    required: false,
  },
  genre: {
    type: String,
    required: false,
  },
  location: {
    genreCode: { type: String, required: false },
    shelf: { type: Number, required: false },
    level: { type: Number, required: false },
  },
  publisher: {
    type: String,
    required: false,
  },
  accessionNumber: {
    type: String,
    required: false,
    default: null,
  },
  callNumber: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: false,
  }
}, {
  timestamps: true
});

// Simple indexes for better performance
bookSchema.index({ title: 1 });
bookSchema.index({ genre: 1 });
bookSchema.index({ accessionNumber: 1 });
bookSchema.index({ createdAt: -1 });

// Pre-save middleware to clean up expired reservations
bookSchema.pre('save', function (next) {
  const now = new Date();

  // Clear expired reservations automatically
  if (this.reserveUntil && this.reserveUntil < now) {
    this.reservedBy = null;
    this.reservedAt = null;
    this.reserveUntil = null;
  }

  next();
});

module.exports = mongoose.model('Book', bookSchema);
