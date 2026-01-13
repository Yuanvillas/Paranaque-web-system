const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const books = await Book.find({}).select('title').lean();
    console.log('Books in database:');
    books.forEach((b, i) => console.log(`${i+1}. ${b.title}`));
    await mongoose.connection.close();
  } catch(e) { 
    console.error(e.message); 
  }
})();
