const mongoose = require('mongoose');
const Book = require('./models/Book');
const Counter = require('./models/Counter');
require('dotenv').config();

const initializeCounter = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    // Count existing books with accession numbers
    const booksWithAccession = await Book.find({
      accessionNumber: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`📚 Found ${booksWithAccession.length} books with accession numbers`);
    
    // Initialize or update the counter to the highest current accession number
    let counterValue = booksWithAccession.length;
    
    // Also check the actual highest number in case there are gaps
    const lastBook = await Book.findOne({
      accessionNumber: { $exists: true, $ne: null, $ne: '' }
    }).sort({ createdAt: -1 });
    
    if (lastBook && lastBook.accessionNumber) {
      const parts = lastBook.accessionNumber.split('-');
      if (parts.length === 2) {
        const highestSequence = parseInt(parts[1]);
        counterValue = Math.max(counterValue, highestSequence);
        console.log(`📈 Highest sequence number found: ${highestSequence}`);
      }
    }
    
    // Update or create the counter
    const counter = await Counter.findOneAndUpdate(
      { name: 'accessionNumber' },
      { value: counterValue },
      { new: true, upsert: true }
    );
    
    console.log(`✅ Counter initialized with value: ${counter.value}`);
    console.log(`   Next accession number will be: ${new Date().getFullYear()}-${String(counter.value + 1).padStart(4, '0')}`);
    
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (err) {
    console.error("❌ Error initializing counter:", err.message);
    process.exit(1);
  }
};

initializeCounter();
