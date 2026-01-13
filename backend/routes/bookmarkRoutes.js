// routes/bookmarkRoutes.js
const express = require("express");
const router = express.Router();
const Bookmarks = require("../models/Bookmark");
const User = require("../models/User");
const Book = require("../models/Book");
require("dotenv").config();

router.post("/add", async (req, res) => {
  try {
    const { email, book_id } = req.body;
    console.log("/add",  email, book_id);

    if (!email || !book_id) {
      return res.status(400).json({ message: "Email and book_id are required." });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate book exists
    const book = await Book.findById(book_id);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    // Check if bookmark already exists
    const existing = await Bookmarks.findOne({
      book_id: book._id,
      user_id: user._id
    });

    if (existing) {
      return res.status(409).json({ message: "Book already in bookmark list." });
    }

    // Create bookmark
    const bookmark = await Bookmarks.create({
      book_id: book._id,
      user_id: user._id
    });

    return res.status(201).json({
      message: "Bookmarked successfully!",
      bookmark
    });

  } catch (err) {
    console.error("Bookmark Add Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.get("/get", async (req, res) => {
  try {
    const { email } = req.query;
      console.log("/add",  email);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found." });

    const bookmarks = await Bookmarks.find({ user_id: user._id })
      .populate("book_id"); // fetch book info too

    res.json({
      total: bookmarks.length,
      bookmarks
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const { email, book_id } = req.body;
    console.log("/dedlete: ", email, book_id);

    if (!email || !book_id) {
      return res.status(400).json({ message: "Email and book_id are required." });
    }

    // Get user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found." });

    const deleted = await Bookmarks.findOneAndDelete({
      book_id,
      user_id: user._id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Bookmark not found." });
    }

    res.json({ message: "Bookmark removed successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.delete("/delete/all", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Delete all bookmarks by user_id
    const deleted = await Bookmarks.deleteMany({ user_id: user._id });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "No bookmarks found for this user." });
    }

    res.json({
      message: "All bookmarks removed successfully.",
      deletedCount: deleted.deletedCount
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
});


module.exports = router;
