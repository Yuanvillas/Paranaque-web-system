const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Transaction = require('./models/Transaction');
const Book = require('./models/Book');

async function checkDuplicates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all active/borrowed transactions
    const activeTransactions = await Transaction.find({
      status: { $in: ['active', 'borrowed'] },
      type: 'borrow'
    }).sort({ bookId: 1, userEmail: 1 });

    console.log(`📊 Total active borrow transactions: ${activeTransactions.length}\n`);

    // Group by bookId and userEmail to find duplicates
    const groups = {};
    activeTransactions.forEach(t => {
      const key = `${t.bookId}_${t.userEmail}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    });

    // Find duplicates
    const duplicates = Object.entries(groups).filter(([key, transactions]) => transactions.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
    } else {
      console.log(`⚠️  Found ${duplicates.length} duplicate groups:\n`);
      
      for (const [key, transactions] of duplicates) {
        const [bookId, userEmail] = key.split('_');
        const book = await Book.findById(bookId);
        console.log(`\n📖 Book: "${book?.title}" (${bookId})`);
        console.log(`👤 User: ${userEmail}`);
        console.log(`⚠️  Found ${transactions.length} transactions:`);
        
        transactions.forEach((t, idx) => {
          console.log(`   ${idx + 1}. ID: ${t._id}, Status: ${t.status}, Created: ${t.createdAt}`);
        });
      }
    }

    // Display all active borrow transactions for reference
    console.log(`\n\n📋 All active borrow transactions:`);
    const bookTransactions = {};
    activeTransactions.forEach(t => {
      if (!bookTransactions[t.bookId]) {
        bookTransactions[t.bookId] = [];
      }
      bookTransactions[t.bookId].push(t);
    });

    for (const [bookId, transactions] of Object.entries(bookTransactions)) {
      const book = await Book.findById(bookId);
      console.log(`\n📖 "${book?.title}":`);
      transactions.forEach(t => {
        console.log(`   - ${t.userEmail} (Status: ${t.status})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkDuplicates();
