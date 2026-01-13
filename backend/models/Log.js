const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userEmail: String,
  action: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Log', logSchema);
