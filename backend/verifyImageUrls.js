// Verify that Unsplash URLs are accessible
const Book = require('./models/Book');
const mongoose = require('mongoose');
require('dotenv').config();

async function verifyImages() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected\n");

    const books = await Book.find({}).select('title image').limit(5);
    
    console.log("🔍 Testing first 5 book image URLs:\n");
    
    for (const book of books) {
      if (!book.image) {
        console.log(`❌ "${book.title}" - No image URL`);
        continue;
      }

      console.log(`\n📖 Testing "${book.title}"`);
      console.log(`   URL: ${book.image.substring(0, 80)}...`);
      
      try {
        const response = await fetch(book.image, { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        
        if (response.ok || response.status === 0) {
          console.log(`   ✅ URL is accessible`);
        } else {
          console.log(`   ❌ Status: ${response.status}`);
        }
      } catch (err) {
        console.log(`   ⚠️  Error: ${err.message}`);
      }
    }

    console.log("\n✨ If URLs show as accessible, images should load in the browser");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

verifyImages();
