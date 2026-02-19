// Script to assign Book IDs to all existing books in the database
const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');
const Counter = require('./models/Counter');

async function assignBookIds() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB\n");

    // Get all books sorted by creation date
    const allBooks = await Book.find({}).sort({ createdAt: 1 });
    console.log(`📚 Found ${allBooks.length} books in database\n`);

    if (allBooks.length === 0) {
      console.log("✅ No books found. Counter will start from 0.");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Check which books already have bookIds
    const booksWithoutId = allBooks.filter(book => !book.bookId);
    const booksWithId = allBooks.filter(book => book.bookId);

    console.log(`📊 Statistics:`);
    console.log(`   - Books with Book ID: ${booksWithId.length}`);
    console.log(`   - Books without Book ID: ${booksWithoutId.length}`);
    console.log(`   - Total books: ${allBooks.length}\n`);

    if (booksWithId.length > 0) {
      console.log("📖 Existing Book IDs:");
      booksWithId.slice(0, 5).forEach((book, i) => {
        console.log(`   ${i + 1}. ${book.title} → ${book.bookId}`);
      });
      if (booksWithId.length > 5) {
        console.log(`   ... and ${booksWithId.length - 5} more`);
      }
    }

    // Find the highest existing Book ID number
    let maxBookIdNumber = 0;
    
    if (booksWithId.length > 0) {
      for (const book of booksWithId) {
        const match = book.bookId.match(/BK-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxBookIdNumber) {
            maxBookIdNumber = num;
          }
        }
      }
    }

    console.log(`\n🔢 Highest existing Book ID number: ${maxBookIdNumber}`);
    console.log(`📈 Next Book ID will be: BK-${String(maxBookIdNumber + 1).padStart(4, '0')}\n`);

    // Update Counter in database
    const counterName = 'bookId-global';
    await Counter.findOneAndUpdate(
      { name: counterName },
      { value: maxBookIdNumber },
      { upsert: true }
    );
    console.log(`✅ Counter set to: ${maxBookIdNumber}\n`);

    // Assign Book IDs to books without one
    if (booksWithoutId.length > 0) {
      console.log(`📝 Assigning Book IDs to ${booksWithoutId.length} books...\n`);

      let counter = maxBookIdNumber;
      const updatePromises = [];

      for (const book of booksWithoutId) {
        counter++;
        const bookId = `BK-${String(counter).padStart(4, '0')}`;
        
        updatePromises.push(
          Book.findByIdAndUpdate(book._id, { bookId: bookId }).then(() => {
            console.log(`✅ ${book.title} → ${bookId}`);
          })
        );
      }

      await Promise.all(updatePromises);

      console.log(`\n✅ Updated Counter to: ${counter}`);
      await Counter.findOneAndUpdate(
        { name: counterName },
        { value: counter },
        { upsert: true }
      );
    } else {
      console.log("✅ All books already have Book IDs!");
    }

    console.log("\n✅ Book ID assignment complete!");
    console.log("\n📊 Final Statistics:");
    const updatedBooks = await Book.find({});
    const withId = updatedBooks.filter(b => b.bookId).length;
    const withoutId = updatedBooks.filter(b => !b.bookId).length;
    console.log(`   - Books with Book ID: ${withId}`);
    console.log(`   - Books without Book ID: ${withoutId}`);
    console.log(`   - Total books: ${updatedBooks.length}`);

    console.log("\n✨ Sample of updated books:");
    updatedBooks.slice(0, 5).forEach((book, i) => {
      console.log(`   ${i + 1}. ID: ${book.bookId} | Title: ${book.title}`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  } catch (err) {
    console.error("❌ Error assigning book IDs:", err);
    process.exit(1);
  }
}

assignBookIds();
