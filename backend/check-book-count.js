const mongoose = require('mongoose');
const Book = require('./models/Book');
require('dotenv').config();

async function checkBookCount() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get books in circulation (the chatbot's query)
    const circulationBooks = await Book.find({
      archived: false,
      availableStock: { $gt: 0 }
    }).select('title author availableStock archived');

    console.log(`📊 BOOKS IN CIRCULATION:`);
    console.log(`Total Count: ${circulationBooks.length}`);
    console.log(`Chatbot Reports: 12\n`);
    
    if (circulationBooks.length !== 12) {
      console.log(`⚠️  MISMATCH DETECTED! Expected 12, but found ${circulationBooks.length}\n`);
    } else {
      console.log(`✅ Count matches!\n`);
    }

    console.log("Books in circulation:");
    console.log("=".repeat(80));
    circulationBooks.forEach((book, index) => {
      console.log(`${index + 1}. "${book.title}" by ${book.author || 'Unknown'} | Available: ${book.availableStock}`);
    });

    // Also check total books (including archived)
    const totalBooks = await Book.find({}).countDocuments();
    const archivedBooks = await Book.find({ archived: true }).countDocuments();
    
    console.log("\n" + "=".repeat(80));
    console.log(`📈 Additional Stats:`);
    console.log(`Total Books (all): ${totalBooks}`);
    console.log(`Archived Books: ${archivedBooks}`);
    console.log(`Non-archived Books: ${totalBooks - archivedBooks}`);
    
    // Check books with no available stock
    const noStockBooks = await Book.find({
      archived: false,
      availableStock: { $lte: 0 }
    }).select('title author availableStock');
    
    console.log(`Books with no available stock: ${noStockBooks.length}`);
    if (noStockBooks.length > 0) {
      console.log("\nBooks with no stock:");
      noStockBooks.forEach((book, index) => {
        console.log(`  ${index + 1}. "${book.title}" by ${book.author || 'Unknown'} | Stock: ${book.availableStock}`);
      });
    }

    await mongoose.connection.close();
    console.log("\n✅ Connection closed");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkBookCount();
