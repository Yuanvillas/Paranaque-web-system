const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Book = require('./models/Book');
const Transaction = require('./models/Transaction');
const User = require('./models/User');
const Log = require('./models/Log');

async function cleanupDeletedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check ALL transactions first
    const allTransactions = await Transaction.find({});
    console.log(`\n📊 Total transactions in DB: ${allTransactions.length}`);
    
    // Count by status
    const byStatus = {};
    allTransactions.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });
    console.log('   By status:', byStatus);

    // Find all books with borrowedBy set
    const booksWithBorrower = await Book.find({ borrowedBy: { $ne: null } });
    console.log(`\n📚 Books currently marked as borrowed: ${booksWithBorrower.length}`);
    
    if (booksWithBorrower.length > 0) {
      console.log('\n   Books with borrowedBy:');
      for (const book of booksWithBorrower) {
        const userExists = await User.findOne({ email: book.borrowedBy });
        console.log(`   - "${book.title}" borrowed by ${book.borrowedBy} (user exists: ${!!userExists})`);
      }
    }

    // Find all active borrow transactions (including those with status 'borrowed')
    const activeTransactions = await Transaction.find({
      type: 'borrow',
      status: { $in: ['active', 'borrowed'] }
    });

    console.log(`\n📚 Found ${activeTransactions.length} active borrow transactions`);

    let returnedCount = 0;
    let skippedCount = 0;

    // Check each transaction's user
    for (const transaction of activeTransactions) {
      const userExists = await User.findOne({ email: transaction.userEmail });
      
      if (!userExists) {
        // User has been deleted, return the book
        console.log(`\n⚠️  User ${transaction.userEmail} not found, returning book: ${transaction.bookTitle}`);
        
        const book = await Book.findById(transaction.bookId);
        if (book) {
          // Increment availableStock since it was borrowed
          const oldStock = book.availableStock || 0;
          book.availableStock = oldStock + 1;
          book.borrowedBy = null;
          book.borrowedAt = null;
          await book.save();
          console.log(`   ✅ Updated book stock from ${oldStock} to ${book.availableStock}`);
        }

        // Mark transaction as completed
        transaction.status = 'completed';
        transaction.returnDate = new Date();
        await transaction.save();

        // Log the action
        await new Log({
          userEmail: 'system',
          action: 'return',
          actionType: 'transaction',
          transactionId: transaction._id,
          bookId: transaction.bookId,
          bookTitle: transaction.bookTitle,
          description: `Auto-returned book from deleted user (was borrowed by ${transaction.userEmail})`
        }).save();

        returnedCount++;
        console.log(`   ✅ Marked transaction as completed`);
      } else {
        skippedCount++;
      }
    }

    // Also check books with borrowedBy that don't have active transactions
    console.log(`\n\n🔧 Checking for books with borrowedBy but no active transaction...`);
    let orphanedCount = 0;
    for (const book of booksWithBorrower) {
      const hasActiveTransaction = await Transaction.findOne({
        bookId: book._id,
        status: 'active'
      });
      
      if (!hasActiveTransaction) {
        console.log(`\n⚠️  Book "${book.title}" has borrowedBy="${book.borrowedBy}" but no active transaction`);
        book.borrowedBy = null;
        book.borrowedAt = null;
        await book.save();
        console.log(`   ✅ Cleared borrowedBy and borrowedAt`);
        orphanedCount++;
      }
    }

    console.log(`\n\n✅ Cleanup completed!`);
    console.log(`   📊 Returned from deleted users: ${returnedCount} books`);
    console.log(`   📊 Skipped (active user): ${skippedCount} books`);
    console.log(`   📊 Cleaned up orphaned: ${orphanedCount} books`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error in cleanup:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanupDeletedUsers();
