const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('./models/Book');

async function checkDatabaseImageUrls() {
  try {
    // Connect with explicit MONGO_URI (will fail gracefully)
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('⚠️  MONGO_URI not found in .env');
      console.log('Checking if server is running...');
      process.exit(0);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const books = await Book.find({}).limit(5);
    
    console.log('📖 Sample books from database:');
    books.forEach((book, i) => {
      console.log(`\n${i+1}. ${book.title}`);
      console.log(`   Image URL: ${book.image}`);
      if (book.image) {
        console.log(`   Type: ${book.image.includes('unsplash') ? '🖼️ Unsplash' : book.image.includes('supabase') ? '🏢 Supabase' : '❓ Unknown'}`);
      }
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabaseImageUrls();
