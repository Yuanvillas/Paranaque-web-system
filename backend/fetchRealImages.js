const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

// Hardcoded Supabase credentials from upload.js
const SUPABASE_URL = 'https://rqseuhdpktquhlqojoqg.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxc2V1aGRwa3RxdWhsbHFqb3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk2Njk5NDksImV4cCI6MTk4NTI0OTk0OX0.wEA7LxlEd2K-2mWQd0vEJBwDCfTJEgqxFz6BvQQfcxY';

const Book = require('./models/Book');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchAndUpdateRealImages() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('❌ MONGO_URI environment variable not found');
      console.log('Please ensure .env is properly configured');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Fetch all files from Supabase book bucket
    console.log('\n🔍 Fetching all files from Supabase book_bucket/book/...');
    const { data: files, error } = await supabase.storage
      .from('book_bucket')
      .list('book', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('❌ Error fetching Supabase files:', error);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found ${files.length} files in Supabase\n`);

    if (files.length === 0) {
      console.log('⚠️  No files found in Supabase book_bucket/book/');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get all books from database
    const allBooks = await Book.find({});
    console.log(`📚 Total books in database: ${allBooks.length}\n`);

    // Create a map of supabase files by normalized name
    const supabaseFileMap = {};
    files.forEach(file => {
      // Extract title from filename: timestamp-title.jpg
      const parts = file.name.split('-');
      if (parts.length >= 2) {
        const titlePart = parts.slice(1).join('-').replace(/\.jpg$/i, '').replace(/\.png$/i, '');
        supabaseFileMap[titlePart.toLowerCase().trim()] = file.name;
      }
    });

    console.log('📋 Matching books with Supabase files:\n');
    let matched = 0;
    let updateCount = 0;
    const unmatched = [];

    // Try to match each book with a supabase file
    for (const book of allBooks) {
      const bookTitle = book.title.toLowerCase().trim();
      const supabaseFile = supabaseFileMap[bookTitle];

      if (supabaseFile) {
        const realUrl = `${SUPABASE_URL}/storage/v1/object/public/book_bucket/book/${supabaseFile}`;
        
        // Only update if the book doesn't already have this URL
        if (book.image !== realUrl) {
          await Book.findByIdAndUpdate(book._id, { image: realUrl });
          updateCount++;
          console.log(`✅ ${book.title}`);
          console.log(`   → ${supabaseFile}`);
        } else {
          console.log(`✓ ${book.title} (already updated)`);
        }
        matched++;
      } else {
        unmatched.push(book.title);
      }
    }

    console.log(`\n📊 RESULTS:`);
    console.log(`✅ Matched: ${matched}/${allBooks.length}`);
    console.log(`💾 Updated: ${updateCount}`);
    console.log(`❌ Unmatched: ${unmatched.length}`);

    if (unmatched.length > 0 && unmatched.length <= 10) {
      console.log('\n❌ Books without matching Supabase files:');
      unmatched.forEach(title => console.log(`   - ${title}`));
    }

    if (updateCount > 0) {
      console.log(`\n✨ Successfully updated ${updateCount} books with real Supabase URLs!`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchAndUpdateRealImages();
