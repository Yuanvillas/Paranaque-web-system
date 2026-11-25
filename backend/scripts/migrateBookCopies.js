const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const { ensureBookCopies } = require('../utils/bookCopyInventory');

dotenv.config();

const applyChanges = process.argv.includes('--apply');

async function migrateBookCopies() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to run the copy inventory migration.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(applyChanges
    ? 'Applying book-copy migration...'
    : 'Dry run only. Pass --apply to create copy records.');

  let scanned = 0;
  let requiringCopies = 0;
  let created = 0;
  const books = Book.find({}).select('_id bookId title stock availableStock').cursor();

  for await (const book of books) {
    scanned++;
    const stock = Math.max(0, Number(book.stock) || 0);
    const existing = await BookCopy.countDocuments({
      bookId: book._id,
      status: { $ne: 'retired' }
    });
    const missing = Math.max(0, stock - existing);

    if (missing === 0) continue;

    requiringCopies++;
    console.log(`${applyChanges ? 'Migrate' : 'Would migrate'} ${book.bookId || book._id}: ${missing} copy record(s)`);
    if (applyChanges) {
      await ensureBookCopies(book);
      created += missing;
    }
  }

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    scannedBooks: scanned,
    booksNeedingCopies: requiringCopies,
    copyRecordsCreated: created
  }, null, 2));
}

migrateBookCopies()
  .catch(error => {
    console.error('Book-copy migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  });
