const mongoose = require('mongoose');
const Book = require('./models/Book');
const Counter = require('./models/Counter');
require('dotenv').config();

const initializeCounter = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    const currentYear = new Date().getFullYear();
    const counterName = `accessionNumber-${currentYear}`;
    
    // Check if counter already exists
    const existingCounter = await Counter.findOne({ name: counterName });
    
    if (existingCounter) {
      console.log(`✅ Counter for ${currentYear} already exists with value: ${existingCounter.value}`);
      console.log(`   Next accession number will be: ${currentYear}-${String(existingCounter.value + 1).padStart(4, '0')}`);
      await mongoose.connection.close();
      console.log("✅ Database connection closed");
      return;
    }
    
    // Only initialize if counter doesn't exist
    console.log(`🔢 Initializing new counter for year ${currentYear}...`);
    
    // Count books with accession numbers for THIS YEAR
    const booksWithAccession = await Book.find({
      accessionNumber: { $exists: true, $ne: null, $ne: '', $regex: `^${currentYear}-` }
    });
    
    console.log(`📚 Found ${booksWithAccession.length} books with accession numbers for ${currentYear}`);
    
    // Find the highest accession number for this year
    let counterValue = booksWithAccession.length;
    
    const lastBook = await Book.findOne({
      accessionNumber: { $regex: `^${currentYear}-` }
    }).sort({ createdAt: -1 });
    
    if (lastBook && lastBook.accessionNumber) {
      const parts = lastBook.accessionNumber.split('-');
      if (parts.length === 2) {
        const highestSequence = parseInt(parts[1]);
        counterValue = Math.max(counterValue, highestSequence);
        console.log(`📈 Highest sequence number found for ${currentYear}: ${highestSequence}`);
      }
    }
    
    // Create the counter for this year
    const counter = await Counter.create({
      name: counterName,
      value: counterValue
    });
    
    console.log(`✅ Counter initialized for ${currentYear} with value: ${counter.value}`);
    console.log(`   Next accession number will be: ${currentYear}-${String(counter.value + 1).padStart(4, '0')}`);
    
    // Clean up old counter if it exists
    await Counter.findOneAndDelete({ name: 'accessionNumber' });
    console.log(`🧹 Cleaned up old global counter`);
    
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (err) {
    console.error("❌ Error initializing counter:", err.message);
    process.exit(1);
  }
};

initializeCounter();
