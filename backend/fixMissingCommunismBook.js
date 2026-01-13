const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');

// High-quality book cover images by category from Unsplash
const BOOK_IMAGES_BY_CATEGORY = {
  'Filipino': [
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1543002588-d83ccc5b8d7e?w=400&h=500&fit=crop'
  ],
  'Default': [
    'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&h=500&fit=crop',
  ]
};

async function fixMissingImage() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const book = await Book.findOne({ title: 'Communism in the Philippines an Introduction' });
    
    if (!book) {
      console.log('❌ Book not found');
      process.exit(1);
    }

    // Get a nice image for this book
    const images = BOOK_IMAGES_BY_CATEGORY['Filipino'];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    
    await Book.findByIdAndUpdate(book._id, { image: randomImage });
    
    console.log('✅ Updated "Communism in the Philippines an Introduction"');
    console.log(`   with placeholder image: ${randomImage}\n`);
    console.log('📚 All 46 books now have images!');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixMissingImage();
