const BookCopy = require('../models/BookCopy');
const Counter = require('../models/Counter');

const counterNameFor = book => `book-copy-${book._id}`;

const formatCopyNumber = (book, sequence) => {
  const catalogId = book.bookId || `BOOK-${book._id}`;
  return `${catalogId}-C${String(sequence).padStart(3, '0')}`;
};

const calculateStockChange = (currentStock, currentAvailableStock, newStock) => {
  if (!Number.isInteger(newStock) || newStock < 0) {
    const error = new Error('Stock must be a non-negative whole number.');
    error.status = 400;
    throw error;
  }

  const oldStock = Math.max(0, Number(currentStock) || 0);
  const availableStock = Math.min(oldStock, Math.max(
    0,
    Number(currentAvailableStock !== undefined ? currentAvailableStock : oldStock) || 0
  ));
  const borrowedCount = oldStock - availableStock;
  if (newStock < borrowedCount) {
    const error = new Error('Stock cannot be reduced below the number of copies currently on loan.');
    error.status = 400;
    throw error;
  }

  return {
    borrowedCount,
    availableStock: newStock - borrowedCount,
    delta: newStock - oldStock
  };
};

const createCopies = async (book, count, status = 'available') => {
  if (count <= 0) return [];

  const counterName = counterNameFor(book);
  const highestCopy = await BookCopy.findOne({ bookId: book._id })
    .sort({ sequence: -1 })
    .select('sequence')
    .lean();

  await Counter.updateOne(
    { name: counterName },
    { $max: { value: highestCopy ? highestCopy.sequence : 0 } },
    { upsert: true }
  );

  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: count } },
    { new: true, upsert: true }
  );
  const firstSequence = counter.value - count + 1;
  const copies = Array.from({ length: count }, (_, index) => {
    const sequence = firstSequence + index;
    return {
      bookId: book._id,
      copyNumber: formatCopyNumber(book, sequence),
      sequence,
      status
    };
  });

  return BookCopy.insertMany(copies);
};

const ensureBookCopies = async book => {
  const stock = Math.max(0, Number(book.stock) || 0);
  const availableStock = Math.min(stock, Math.max(
    0,
    Number(book.availableStock !== undefined ? book.availableStock : stock) || 0
  ));
  const borrowedCount = stock - availableStock;
  const activeCopies = await BookCopy.find({
    bookId: book._id,
    status: { $ne: 'retired' }
  }).select('status').lean();
  const missingCount = stock - activeCopies.length;

  if (missingCount <= 0) return;

  const representedBorrowed = activeCopies.filter(copy =>
    copy.status === 'on-loan' || copy.status === 'legacy-unassigned'
  ).length;
  const borrowedPlaceholders = Math.min(
    missingCount,
    Math.max(0, borrowedCount - representedBorrowed)
  );

  if (borrowedPlaceholders > 0) {
    await createCopies(book, borrowedPlaceholders, 'legacy-unassigned');
  }
  await createCopies(book, missingCount - borrowedPlaceholders, 'available');
};

const syncCopiesForStockChange = async (book, newStock) => {
  const stockChange = calculateStockChange(book.stock, book.availableStock, newStock);
  await ensureBookCopies(book);
  const { delta, borrowedCount, availableStock } = stockChange;
  if (delta > 0) {
    await createCopies(book, delta);
  } else if (delta < 0) {
    const copiesToRetire = await BookCopy.find({
      bookId: book._id,
      status: 'available'
    }).sort({ sequence: -1 }).limit(Math.abs(delta));

    if (copiesToRetire.length !== Math.abs(delta)) {
      const error = new Error('Stock cannot be reduced because there are not enough available copies to retire.');
      error.status = 400;
      throw error;
    }

    const retiredAt = new Date();
    await BookCopy.updateMany(
      { _id: { $in: copiesToRetire.map(copy => copy._id) } },
      { $set: { status: 'retired', retiredAt } }
    );
  }

  return { borrowedCount, availableStock };
};

const assignCopyToTransaction = async (book, transaction) => {
  await ensureBookCopies(book);
  const copy = await BookCopy.findOneAndUpdate(
    { bookId: book._id, status: 'available' },
    {
      $set: {
        status: 'on-loan',
        transactionId: transaction._id,
        borrowedBy: transaction.userEmail,
        borrowedAt: new Date()
      }
    },
    { new: true, sort: { sequence: 1 } }
  );

  if (!copy) return null;
  transaction.copyId = copy._id;
  transaction.copyNumber = copy.copyNumber;
  return copy;
};

const releaseCopyForTransaction = async transaction => {
  if (transaction.copyId) {
    const releasedCopy = await BookCopy.findOneAndUpdate(
      {
        _id: transaction.copyId,
        transactionId: transaction._id,
        status: 'on-loan'
      },
      {
        $set: {
          status: 'available',
          transactionId: null,
          borrowedBy: null,
          borrowedAt: null
        }
      },
      { new: true }
    );

    if (!releasedCopy) {
      throw new Error(`Could not release assigned copy ${transaction.copyNumber || transaction.copyId}.`);
    }
    return releasedCopy;
  }

  return BookCopy.findOneAndUpdate(
    { bookId: transaction.bookId, status: 'legacy-unassigned' },
    {
      $set: {
        status: 'available',
        transactionId: null,
        borrowedBy: null,
        borrowedAt: null
      }
    },
    { new: true, sort: { sequence: 1 } }
  );
};

module.exports = {
  assignCopyToTransaction,
  calculateStockChange,
  createCopies,
  ensureBookCopies,
  formatCopyNumber,
  releaseCopyForTransaction,
  syncCopiesForStockChange
};
