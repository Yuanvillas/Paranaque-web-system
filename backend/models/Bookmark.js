// models/Bookmarks.js
const mongoose = require('mongoose');

const bookmarksSchema = new mongoose.Schema(
  {
    book_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Bookmarks", bookmarksSchema);
