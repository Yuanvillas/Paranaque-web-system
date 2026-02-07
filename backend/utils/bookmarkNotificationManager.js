const Bookmark = require('../models/Bookmark');
const User = require('../models/User');
const { sendBookAvailableEmail } = require('./emailService');

/**
 * Check if a book is now available and notify all users who bookmarked it
 * @param {String} bookId - The ID of the book
 * @param {Object} book - The book object with title and availableStock
 * @returns {Promise<Array>} - Array of users notified
 */
const notifyBookmarkUsersIfAvailable = async (bookId, book) => {
  try {
    if (!book || !book.availableStock || book.availableStock <= 0) {
      console.log(`Book ${bookId} is not available, skipping bookmark notifications`);
      return [];
    }

    // Find all users who bookmarked this book
    const bookmarks = await Bookmark.find({ book_id: bookId }).populate('user_id');
    
    if (bookmarks.length === 0) {
      console.log(`No bookmarks found for book ${bookId}`);
      return [];
    }

    const notifiedUsers = [];
    
    for (const bookmark of bookmarks) {
      try {
        const user = bookmark.user_id;
        if (user && user.email) {
          console.log(`📧 Sending availability notification to ${user.email} for book ${book.title}`);
          
          // Send email notification
          await sendBookAvailableEmail(user.email, book.title, book.availableStock).catch(err => {
            console.error(`Failed to send email to ${user.email}:`, err.message);
          });
          
          notifiedUsers.push({
            email: user.email,
            userId: user._id,
            bookId: bookId,
            bookTitle: book.title,
            notifiedAt: new Date()
          });
        }
      } catch (err) {
        console.error(`Error processing bookmark for user:`, err);
      }
    }

    if (notifiedUsers.length > 0) {
      console.log(`✅ Notified ${notifiedUsers.length} users about book availability: ${book.title}`);
    }

    return notifiedUsers;
  } catch (err) {
    console.error('❌ Error in notifyBookmarkUsersIfAvailable:', err);
    return [];
  }
};

module.exports = {
  notifyBookmarkUsersIfAvailable
};
