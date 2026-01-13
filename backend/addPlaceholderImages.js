// Script to add placeholder images to books without images
const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');

const PLACEHOLDER_IMAGES = {
  'Science': 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=300&h=400&fit=crop',
  'Math': 'https://images.unsplash.com/photo-1635070041078-e371007abe80?w=300&h=400&fit=crop',
  'Filipino': 'https://images.unsplash.com/photo-150784272343-583f20270319?w=300&h=400&fit=crop',
  'English': 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=300&h=400&fit=crop',
  'Fiction': 'https://images.unsplash.com/photo-1543002588-d83ccc5b8d7e?w=300&h=400&fit=crop',
  'History': 'https://images.unsplash.com/photo-1544716278-ca5e3af2abd8?w=300&h=400&fit=crop',
  'Biography': 'https://images.unsplash.com/photo-1507842999318-382c28075e50?w=300&h=400&fit=crop',
  'Self-Help': 'https://images.unsplash.com/photo-150784272343-583f20270319?w=300&h=400&fit=crop'
};

async function addPlaceholderImages() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB\n");

    // Find all books without images
    const booksWithoutImages = await Book.find({ 
      $or: [
        { image: null },
        { image: undefined },
        { image: '' }
      ]
    });

    console.log(`📚 Found ${booksWithoutImages.length} books without images\n`);

    if (booksWithoutImages.length === 0) {
      console.log("✅ All books already have images!");
      await mongoose.connection.close();
      process.exit(0);
    }

    let updatedCount = 0;
    const results = [];

    for (const book of booksWithoutImages) {
      try {
        // Get placeholder based on category
        const category = book.category || book.genre || 'Fiction';
        const placeholderUrl = PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES['Fiction'];

        // Update book with placeholder image
        book.image = placeholderUrl;
        await book.save();

        updatedCount++;
        results.push({
          title: book.title,
          category: category,
          image: '✅ Added placeholder',
          status: 'Success'
        });

        console.log(`✅ ${book.title} - Added ${category} placeholder`);
      } catch (err) {
        console.error(`❌ Error updating ${book.title}:`, err.message);
        results.push({
          title: book.title,
          status: 'Failed',
          error: err.message
        });
      }
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 IMAGE PLACEHOLDER UPDATE SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total books without images: ${booksWithoutImages.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Failed: ${booksWithoutImages.length - updatedCount}`);
    console.log(`\n✨ Placeholder images added from Unsplash`);

    if (updatedCount === booksWithoutImages.length) {
      console.log(`\n✅ All books now have images!`);
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
addPlaceholderImages();
