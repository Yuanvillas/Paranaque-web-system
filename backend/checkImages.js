// Quick script to test database connection and check book images
const mongoose = require('mongoose');
const Book = require('./models/Book');

// Load environment variables
require('dotenv').config();

const testConnection = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("Connected to MongoDB");

    // Get a few books and check their images
    const books = await Book.find({ archived: false }).limit(5);
    
    console.log("\n=== Books in Database ===");
    books.forEach((book, idx) => {
      console.log(`\n${idx + 1}. ${book.title}`);
      console.log(`   _id: ${book._id}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Category: ${book.category}`);
      console.log(`   Image: ${book.image ? book.image.substring(0, 50) + '...' : 'NO IMAGE'}`);
      console.log(`   Stock: ${book.stock}`);
      console.log(`   AvailableStock: ${book.availableStock}`);
    });

    // Now test the recommend logic
    console.log("\n\n=== Testing Recommendation Logic ===");
    if (books.length > 0) {
      const borrowedIds = new Set([books[0]._id.toString()]);
      const availableBooks = books.filter(b => !borrowedIds.has(b._id.toString()));
      
      console.log(`Sample borrowed book: ${books[0].title}`);
      console.log(`Available books for recommendations: ${availableBooks.length}`);
      
      availableBooks.forEach((book, idx) => {
        console.log(`\n  Recommendation ${idx + 1}: ${book.title}`);
        console.log(`  - Image: ${book.image ? 'HAS IMAGE' : 'NO IMAGE'}`);
        console.log(`  - Category: ${book.category}`);
      });
    }

    await mongoose.disconnect();
    console.log("\n\nDatabase check complete.");
  } catch (error) {
    console.error("Error:", error.message);
  }
};

testConnection();
