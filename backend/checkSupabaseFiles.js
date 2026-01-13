// Check which Supabase URLs have actual files
const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function checkSupabaseImages() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected\n");

    // Get all books
    const books = await Book.find({}).select('title image category');
    
    console.log(`🔍 Checking which Supabase URLs have real files...\n`);
    
    let supabaseCount = 0;
    let workingSupabaseCount = 0;
    let missingSupabaseCount = 0;
    let unsplashCount = 0;

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      
      if (!book.image) {
        console.log(`${i + 1}. "${book.title}" - ❌ NO IMAGE`);
        continue;
      }

      if (book.image.includes('supabase')) {
        supabaseCount++;
        
        // Try to fetch the Supabase file
        try {
          const response = await fetch(book.image, {
            method: 'HEAD',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          });

          if (response.ok || response.status === 0) {
            workingSupabaseCount++;
            console.log(`${i + 1}. "${book.title}" - ✅ SUPABASE (file exists)`);
          } else {
            missingSupabaseCount++;
            console.log(`${i + 1}. "${book.title}" - ❌ SUPABASE (${response.status} - file missing)`);
          }
        } catch (err) {
          missingSupabaseCount++;
          console.log(`${i + 1}. "${book.title}" - ❌ SUPABASE (error: ${err.message})`);
        }
      } else if (book.image.includes('unsplash')) {
        unsplashCount++;
        console.log(`${i + 1}. "${book.title}" - 🖼️  UNSPLASH (placeholder)`);
      } else {
        console.log(`${i + 1}. "${book.title}" - ❓ OTHER`);
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 SUMMARY:");
    console.log("=".repeat(70));
    console.log(`Total books: ${books.length}`);
    console.log(`🏢 Supabase URLs: ${supabaseCount}`);
    console.log(`   ✅ With real files: ${workingSupabaseCount}`);
    console.log(`   ❌ Missing files: ${missingSupabaseCount}`);
    console.log(`🖼️  Unsplash placeholders: ${unsplashCount}`);
    
    if (workingSupabaseCount > 0) {
      console.log(`\n✨ Found ${workingSupabaseCount} real Supabase images!`);
    } else {
      console.log(`\n⚠️  No working Supabase files found.`);
      console.log(`    Books may have been uploaded but files not saved to Supabase`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkSupabaseImages();
