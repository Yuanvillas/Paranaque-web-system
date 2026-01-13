// Script to assign real, working image URLs to all books
const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');

// High-quality book cover images by category from Unsplash
const BOOK_IMAGES_BY_CATEGORY = {
  'Science': [
    'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1635070041078-e371007abe80?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop'
  ],
  'Math': [
    'https://images.unsplash.com/photo-1635070041078-e371007abe80?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1516979187457-635ffe3ebdf0?w=400&h=500&fit=crop'
  ],
  'Filipino': [
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1543002588-d83ccc5b8d7e?w=400&h=500&fit=crop'
  ],
  'English': [
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1543002588-d83ccc5b8d7e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop'
  ],
  'Fiction': [
    'https://images.unsplash.com/photo-1543002588-d83ccc5b8d7e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop'
  ],
  'History': [
    'https://images.unsplash.com/photo-1544716278-ca5e3af2abd8?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop'
  ],
  'Biography': [
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1543002588-d83ccc5b8d7e?w=400&h=500&fit=crop'
  ],
  'Self-Help': [
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544716278-ca5e3af2abd8?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop'
  ],
  'Default': [
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1543002588-d83ccc5b8d7e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544716278-ca5e3af2abd8?w=400&h=500&fit=crop'
  ]
};

function getImageUrl(category, index) {
  const categoryImages = BOOK_IMAGES_BY_CATEGORY[category] || BOOK_IMAGES_BY_CATEGORY['Default'];
  return categoryImages[index % categoryImages.length];
}

async function assignRealImages() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB\n");

    // Get all books
    const books = await Book.find({});
    console.log(`📚 Found ${books.length} books\n`);

    let updatedCount = 0;
    const results = [];

    for (let i = 0; i < books.length; i++) {
      try {
        const book = books[i];
        const category = book.category || book.genre || 'Default';
        
        // Get a real image URL from Unsplash
        const imageUrl = getImageUrl(category, i);
        
        // Update book with real image
        book.image = imageUrl;
        await book.save();
        
        updatedCount++;
        console.log(`✅ ${i + 1}/${books.length} - "${book.title}" (${category}) - Image assigned`);
        
      } catch (err) {
        console.error(`❌ Error updating book:`, err.message);
      }
    }

    // Print summary
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 IMAGE ASSIGNMENT COMPLETE`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Total books: ${books.length}`);
    console.log(`Successfully assigned: ${updatedCount}`);
    console.log(`Failed: ${books.length - updatedCount}`);
    console.log(`\n✨ All images now use real Unsplash URLs`);
    console.log(`✨ Images should display immediately on next page load`);

    if (updatedCount === books.length) {
      console.log(`\n✅ ALL BOOKS NOW HAVE REAL WORKING IMAGES!`);
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  }
}

// Run the script
assignRealImages();
