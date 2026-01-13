const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('./models/Book');

async function analyzeCurrentImageUrls() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('❌ MONGO_URI not set');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const books = await Book.find({});
    
    console.log('📖 Analyzing current book image URLs in database:\n');
    console.log(`Total books: ${books.length}\n`);

    const supabaseBased = books.filter(b => b.image && b.image.includes('supabase'));
    const unsplashBased = books.filter(b => b.image && b.image.includes('unsplash'));
    const noImage = books.filter(b => !b.image || b.image === '');

    console.log(`📊 Image distribution:`);
    console.log(`  🏢 Supabase-based URLs: ${supabaseBased.length}`);
    console.log(`  🖼️  Unsplash URLs: ${unsplashBased.length}`);
    console.log(`  ❌ No image: ${noImage.length}\n`);

    if (supabaseBased.length > 0) {
      console.log('🏢 Books with Supabase URLs:');
      supabaseBased.slice(0, 10).forEach((book, i) => {
        console.log(`\n${i+1}. ${book.title}`);
        console.log(`   ${book.image}`);
        
        // Extract filename from URL
        const match = book.image.match(/book_bucket\/(.+)$/);
        if (match) {
          console.log(`   File path: ${match[1]}`);
        }
      });
      
      if (supabaseBased.length > 10) {
        console.log(`\n... and ${supabaseBased.length - 10} more`);
      }
    }

    if (unsplashBased.length > 0) {
      console.log('\n\n🖼️  Sample Unsplash URLs:');
      unsplashBased.slice(0, 3).forEach((book, i) => {
        console.log(`\n${i+1}. ${book.title}`);
        console.log(`   ${book.image.substring(0, 80)}...`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Analysis complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeCurrentImageUrls();
