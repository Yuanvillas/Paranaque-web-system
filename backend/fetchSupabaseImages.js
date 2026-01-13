const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// MongoDB connection
const mongoUri = process.env.MONGO_URI;
const Book = require('./models/Book');

async function fetchAndUpdateImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Fetch all files from Supabase book bucket
    console.log('\n🔍 Fetching all files from Supabase book_bucket...');
    const { data: files, error } = await supabase.storage
      .from('book_bucket')
      .list('book', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('❌ Error fetching Supabase files:', error);
      return;
    }

    console.log(`\n📂 Found ${files.length} files in Supabase book_bucket/book/`);

    if (files.length === 0) {
      console.log('⚠️  No files found in Supabase!');
      return;
    }

    // Display all files
    console.log('\n📋 Files in Supabase:');
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
    });

    // Get all books from database
    const allBooks = await Book.find({});
    console.log(`\n📚 Total books in database: ${allBooks.length}`);

    // Create a map of supabase files by normalized name
    const supabaseFileMap = {};
    files.forEach(file => {
      // Extract the title from filename: timestamp-title-book.jpg
      // Remove -book.jpg suffix and timestamp prefix
      let titlePart = file.name.replace(/-book\.jpg$/i, '').replace(/^[0-9]+-/, '');
      supabaseFileMap[titlePart.toLowerCase().trim()] = file.name;
    });

    console.log(`\n🔗 Building URL mapping...`);
    let matched = 0;
    let unmatched = [];

    // Try to match books with supabase files
    for (const book of allBooks) {
      const bookTitle = book.title.toLowerCase().trim();
      const supabaseFile = supabaseFileMap[bookTitle];

      if (supabaseFile) {
        const realUrl = `${supabaseUrl}/storage/v1/object/public/book_bucket/book/${supabaseFile}`;
        console.log(`✅ ${book.title} → ${supabaseFile}`);
        console.log(`   URL: ${realUrl}`);
        matched++;
      } else {
        unmatched.push(book.title);
      }
    }

    console.log(`\n📊 MATCHING RESULTS:`);
    console.log(`✅ Matched: ${matched}/${allBooks.length}`);
    console.log(`❌ Unmatched: ${unmatched.length}`);

    if (unmatched.length > 0) {
      console.log('\n❌ Books without matching Supabase files:');
      unmatched.forEach(title => console.log(`   - ${title}`));
    }

    // Now update the books with real URLs
    if (matched > 0) {
      console.log(`\n💾 Updating ${matched} books with real Supabase URLs...`);
      let updated = 0;

      for (const book of allBooks) {
        const bookTitle = book.title.toLowerCase().trim();
        const supabaseFile = supabaseFileMap[bookTitle];

        if (supabaseFile) {
          const realUrl = `${supabaseUrl}/storage/v1/object/public/book_bucket/book/${supabaseFile}`;
          
          await Book.findByIdAndUpdate(book._id, { image: realUrl });
          updated++;
          console.log(`✅ Updated: ${book.title}`);
        }
      }

      console.log(`\n✨ Successfully updated ${updated} books!`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchAndUpdateImages();
