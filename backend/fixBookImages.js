// Script to diagnose and fix book image issues
const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');
const { getFullImageUrl } = require('./utils/upload');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

async function main() {
  try {
    // Connect to MongoDB
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB");

    // Get all books with images
    const books = await Book.find({ image: { $ne: null } });
    console.log(`\n📚 Found ${books.length} books with images\n`);

    let issueCount = 0;
    let validCount = 0;
    let fixedCount = 0;

    for (const book of books) {
      const bookName = `"${book.title}" (${book._id})`;
      const imageUrl = book.image;

      console.log(`\n📖 Checking ${bookName}`);
      console.log(`   Raw image field: ${imageUrl}`);

      // Check if image field is valid
      if (!imageUrl) {
        console.log(`   ⚠️  No image URL`);
        issueCount++;
        continue;
      }

      // Check if it's a valid URL
      const isValidUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
      const isBase64 = imageUrl.startsWith('data:image/');

      if (!isValidUrl && !isBase64) {
        console.log(`   ❌ ISSUE: Invalid image format`);
        console.log(`   Attempting to fix...`);
        
        // Try to construct valid URL
        const fixedUrl = getFullImageUrl(imageUrl);
        if (fixedUrl && (fixedUrl.startsWith('http://') || fixedUrl.startsWith('https://'))) {
          console.log(`   ✅ Fixed URL: ${fixedUrl.substring(0, 80)}...`);
          book.image = fixedUrl;
          await book.save();
          fixedCount++;
        } else {
          console.log(`   ❌ Could not fix URL`);
          issueCount++;
        }
      } else if (isValidUrl) {
        // Verify Supabase URL is correct
        if (imageUrl.includes('supabase.co') || imageUrl.includes('rqseuhdpktquhlqojoqg')) {
          console.log(`   ✅ Valid Supabase URL`);
          validCount++;
        } else if (imageUrl.includes('paranaledge') || imageUrl.includes('render.com')) {
          console.log(`   ⚠️  Different CDN: ${imageUrl.substring(0, 60)}...`);
          validCount++;
        } else {
          console.log(`   ⚠️  Unknown URL source: ${imageUrl.substring(0, 60)}...`);
          validCount++;
        }
      } else if (isBase64) {
        console.log(`   ✅ Base64 image data stored`);
        validCount++;
      }
    }

    // Print summary
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 IMAGE DIAGNOSTICS SUMMARY`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Total books with images: ${books.length}`);
    console.log(`✅ Valid images: ${validCount}`);
    console.log(`❌ Issues found: ${issueCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    console.log(`\n✨ Supabase URL: ${SUPABASE_URL}`);

    if (issueCount === 0) {
      console.log(`\n✅ All images are valid!`);
    } else {
      console.log(`\n⚠️  Found ${issueCount} image(s) with issues`);
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
main();
