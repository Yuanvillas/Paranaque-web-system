const mongoose = require('mongoose');

const ArchivedUserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  suffix: {
    type: String,
    enum: ['', 'Sr.', 'Jr.', 'II', 'III', 'IV', 'V'],
    default: ''
  },
  contactNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    // Password strength is validated before hashing in the route, so remove the match validator here
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'librarian'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    required: false,
    default: null
  },
  archivedAt: {
    type: Date,
    default: Date.now
  },
  archivedBy: {
    type: String,
    required: false
  },
  reason: {
    type: String,
    required: false
  },
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ArchivedUser', ArchivedUserSchema);
