const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    match: [/^[a-zA-Z\s]+$/, "First name should contain only letters and spaces."]
  },
  lastName: {
    type: String,
    required: true,
    match: [/^[a-zA-Z\s]+$/, "Last name should contain only letters and spaces."]
  },
  suffix: {
    type: String,
    enum: ['', 'Sr.', 'Jr.', 'II', 'III', 'IV', 'V'],
    default: ''
  },
  contactNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{11}$/.test(v);
      },
      message: props => `${props.value} is not a valid 11-digit contact number!`
    }
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."]
  },
  password: {
    type: String,
    required: true,
    // Password strength is validated before hashing in the route, so remove the match validator here
  },
  role: {
    type: String,
    enum: ['user', 'admin', , 'librarian'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  },
  profilePicture: {
    type: String,
    required: false,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
