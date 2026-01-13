const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('./models/Book');

/**
 * MANUAL MAPPING SCRIPT
 * 
 * If you can access your Supabase storage directly and know the image filenames,
 * use this script to map them to books in the database.
 * 
 * HOW TO USE:
 * 1. Go to your Supabase console
 * 2. Check Storage → book_bucket → book folder
 * 3. List all filenames you see there
 * 4. Update the IMAGE_FILE_MAP below with: "Book Title": "filename.jpg"
 * 5. Run: node updateImagesFromSupabase.js
 */

const SUPABASE_URL = 'https://rqseuhdpktquhlqojoqg.supabase.co';

// INSTRUCTION: Manually add your image filenames here
// Format: "Exact Book Title": "filename-in-supabase.jpg"
const IMAGE_FILE_MAP = {
  // Example:
  // "Pananalapi sa BARANGAY": "1765213605221-Pananalapi sa BARANGAY-book.jpg",
  // "Child Rearing and Personality Development in the Philippines": "1765213605222-Child Rearing-book.jpg",
  
  // Add all your images here based on what's in Supabase book_bucket/book/
};

async function updateImagesFromSupabase() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('❌ MONGO_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    if (Object.keys(IMAGE_FILE_MAP).length === 0) {
      console.log('⚠️  IMAGE_FILE_MAP is empty!');
      console.log('\nINSTRUCTIONS:');
      console.log('1. Go to Supabase Dashboard → Storage → book_bucket → book/');
      console.log('2. List all image files you see');
      console.log('3. Update IMAGE_FILE_MAP in this file with: "Book Title": "filename.jpg"');
      console.log('4. Save and run again\n');
      
      // Show books that need images
      const allBooks = await Book.find({});
      console.log(`Found ${allBooks.length} books. Sample titles:\n`);
      allBooks.slice(0, 5).forEach((book, i) => {
        console.log(`${i+1}. "${book.title}"`);
      });
      console.log(`\n... and ${Math.max(0, allBooks.length - 5)} more\n`);
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get all books
    const allBooks = await Book.find({});
    console.log(`Found ${allBooks.length} books in database`);
    console.log(`Found ${Object.keys(IMAGE_FILE_MAP).length} image mappings\n`);

    let updated = 0;
    let notFound = [];

    // Update each book
    for (const book of allBooks) {
      const filename = IMAGE_FILE_MAP[book.title];
      
      if (filename) {
        const realUrl = `${SUPABASE_URL}/storage/v1/object/public/book_bucket/book/${filename}`;
        
        if (book.image !== realUrl) {
          await Book.findByIdAndUpdate(book._id, { image: realUrl });
          updated++;
          console.log(`✅ ${book.title}`);
          console.log(`   → ${filename}`);
        } else {
          console.log(`✓ ${book.title} (already correct)`);
        }
      } else {
        notFound.push(book.title);
      }
    }

    console.log(`\n📊 RESULTS:`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Not in mapping: ${notFound.length}`);

    if (notFound.length > 0 && notFound.length <= 10) {
      console.log('\n❌ Books not in your mapping:');
      notFound.forEach(title => console.log(`   - ${title}`));
    }

    if (updated > 0) {
      console.log(`\n✨ Successfully updated ${updated} books with real Supabase URLs!`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateImagesFromSupabase();
