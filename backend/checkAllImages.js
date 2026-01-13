// Check what images are in database and which ones are working
const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');

async function checkImages() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected\n");

    const books = await Book.find({}).select('title image category');
    
    let supabaseCount = 0;
    let unsplashCount = 0;
    let otherCount = 0;
    let noImageCount = 0;

    console.log("📊 CHECKING ALL BOOK IMAGES:\n");
    
    books.forEach((book, idx) => {
      if (!book.image) {
        console.log(`${idx + 1}. "${book.title}" - ❌ NO IMAGE`);
        noImageCount++;
      } else if (book.image.includes('supabase')) {
        console.log(`${idx + 1}. "${book.title}" - 🏢 SUPABASE`);
        supabaseCount++;
      } else if (book.image.includes('unsplash')) {
        console.log(`${idx + 1}. "${book.title}" - 🖼️ UNSPLASH`);
        unsplashCount++;
      } else {
        console.log(`${idx + 1}. "${book.title}" - ❓ OTHER: ${book.image.substring(0, 50)}`);
        otherCount++;
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY:");
    console.log("=".repeat(60));
    console.log(`📊 Total books: ${books.length}`);
    console.log(`🏢 With Supabase URLs: ${supabaseCount}`);
    console.log(`🖼️  With Unsplash URLs: ${unsplashCount}`);
    console.log(`❓ Other URLs: ${otherCount}`);
    console.log(`❌ No images: ${noImageCount}`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkImages();
