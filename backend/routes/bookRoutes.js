// routes/bookRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const Book = require('../models/Book');
const ArchivedBook = require('../models/ArchivedBook');
const Transaction = require('../models/Transaction');
const Log = require('../models/Log');
const ReservedBook = require('../models/ReservedBook');
const Counter = require('../models/Counter');
const { uploadBase64ToSupabase, getFullImageUrl } = require('../utils/upload');

const router = express.Router();

// Function to get next accession number by incrementing the last book's number
const getNextAccessionNumber = async () => {
  try {
    console.log("🔢 Generating next accession number...");
    
    const currentYear = new Date().getFullYear();
    let nextNumber = 1;
    
    // Try to find the highest accession number in the database
    try {
      const books = await Book.find({ accessionNumber: { $exists: true, $ne: null, $ne: '' } })
        .sort({ createdAt: -1 })
        .limit(1);
      
      if (books && books.length > 0) {
        const lastBook = books[0];
        console.log("📚 Found book with accession:", lastBook.accessionNumber);
        
        const parts = lastBook.accessionNumber.split('-');
        if (parts.length === 2) {
          const lastYear = parseInt(parts[0]);
          const lastSequence = parseInt(parts[1]);
          
          if (lastYear === currentYear) {
            nextNumber = lastSequence + 1;
            console.log("📈 Incrementing sequence to:", nextNumber);
          } else {
            console.log("📆 New year, resetting sequence to 1");
            nextNumber = 1;
          }
        }
      } else {
        console.log("📚 No previous accession numbers found, starting from 1");
        nextNumber = 1;
      }
    } catch (dbErr) {
      console.error("⚠️  Error querying books:", dbErr.message);
      nextNumber = 1;
    }
    
    // Format as YYYY-XXXX
    const sequenceNumber = String(nextNumber).padStart(4, '0');
    const accessionNumber = `${currentYear}-${sequenceNumber}`;
    
    console.log(`✅ Generated accession number: ${accessionNumber}`);
    return accessionNumber;
  } catch (err) {
    console.error('❌ Error in getNextAccessionNumber:', err.message);
    
    // ALWAYS return a fallback - never return null/undefined
    const currentYear = new Date().getFullYear();
    const fallback = `${currentYear}-${String(Date.now()).slice(-4)}`;
    console.log('⚠️  Returning fallback accession number:', fallback);
    return fallback;
  }
};

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Add Book
// Accepts either multipart/form-data (with file) or JSON (with base64 image)
router.post('/', async (req, res) => {
  try {
    console.log("🔵 POST /api/books called");
    console.log("📝 Request body:", req.body);
    const { title, year, image, userEmail, location, author, publisher, callNumber, category, stock } = req.body;
    
    // Validate required fields
    console.log("🔍 Validating required fields...");
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }
    if (isNaN(parseInt(year))) {
      return res.status(400).json({ error: 'Year must be a valid number' });
    }
    if (!stock) {
      return res.status(400).json({ error: 'Stock is required' });
    }
    console.log("✅ All required fields present");
    
    let imageField = null;

    // If image is a base64 string, store it directly
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      imageField = image;
    }

    // If using multipart/form-data, fallback to multer
    if (!imageField && req.file) {
      imageField = req.file.filename;
    }

    let imageUrl = null;

    // Upload profile image
    if (image) {
      try {
        imageUrl = await uploadBase64ToSupabase(
          image,
          "book_bucket",
          `book/${Date.now()}-${title}-book.jpg`
        );
        console.log("Book image uploaded to:", imageUrl);
      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr.message);
        // Continue without image
        imageUrl = null;
      }
    }

    // Auto-generate accession number
    console.log("📚 Generating accession number for:", title);
    let generatedAccessionNumber;
    try {
      generatedAccessionNumber = await getNextAccessionNumber();
      console.log("📚 Generated accession number:", generatedAccessionNumber);
      
      // Verify it's not empty
      if (!generatedAccessionNumber || generatedAccessionNumber.trim() === '') {
        throw new Error('Generated accession number is empty');
      }
    } catch (accessionErr) {
      console.error("❌ Failed to generate accession number:", accessionErr.message);
      generatedAccessionNumber = `${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      console.log("⚠️ Using fallback accession:", generatedAccessionNumber);
    }
    
    // Final verification before saving
    if (!generatedAccessionNumber) {
      const year = new Date().getFullYear();
      generatedAccessionNumber = `${year}-${Date.now().toString().slice(-5)}`;
      console.log("🚨 FINAL FALLBACK accession:", generatedAccessionNumber);
    }

    const newBook = new Book({
      title,
      year,
      image: imageUrl,
      archived: false,
      borrowedAt: null,
      location,
      author,
      publisher,
      accessionNumber: generatedAccessionNumber,
      callNumber,
      category,
      stock: parseInt(stock) || 1,
      availableStock: parseInt(stock) || 1,
      status: 'available'
    });
    
    console.log("💾 Book object before save:");
    console.log("  - title:", newBook.title);
    console.log("  - accessionNumber:", newBook.accessionNumber);
    console.log("  - Full object:", JSON.stringify(newBook.toObject(), null, 2));
    
    console.log("💾 Saving book to database...");
    const savedBook = await newBook.save();
    
    console.log("✅ Book saved successfully!");
    console.log("✅ Saved book accession number:", savedBook.accessionNumber);
    console.log("✅ Full saved object:", JSON.stringify(savedBook.toObject(), null, 2));

    // Log book addition
    await new Log({
      userEmail: userEmail || 'admin',
      action: `Added new book: ${title} (Accession: ${generatedAccessionNumber})`
    }).save();

    res.status(201).json({ message: 'Book added successfully!', book: savedBook });
  } catch (err) {
    console.error("❌ Error adding book - Full Error Object:", err);
    console.error("❌ Error message:", err.message);
    console.error("❌ Error stack:", err.stack);
    
    // Provide detailed error information
    let errorMsg = err.message;
    if (err.errors) {
      // Mongoose validation errors
      console.error("❌ Mongoose validation errors:", err.errors);
      errorMsg = Object.keys(err.errors).map(key => {
        return `${key}: ${err.errors[key].message}`;
      }).join('; ');
    }
    
    res.status(500).json({ 
      error: 'Server error while adding book: ' + errorMsg,
      details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  }
});

router.get("/", async (req, res) => {
  const { genre, status } = req.query;
  console.log("📚 api/books - GET called with genre:", genre, "status:", status);

  try {
    const now = new Date();

    // Auto-release expired reservations
    await Book.updateMany(
      { reserveUntil: { $lt: now } },
      {
        $set: {
          reservedBy: null,
          reservedAt: null,
          reserveUntil: null
        }
      }
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = null;

    if (status === "Available") {
      console.log("Filtering for available books");
      filter = {
        $or: [
          { status: status },
          { status: null }
        ],
        ...(genre ? { category: { $regex: new RegExp(genre, "i") } } : {}),
      };

    } else if (status != null) {
      filter = {
        status: { $eq: status },
        ...(genre ? { category: { $regex: new RegExp(genre, "i") } } : {})
      };
    } else {
      filter = {
        ...(genre ? { category: { $regex: new RegExp(genre, "i") } } : {}),
      };
    }

    console.log("📊 Filter:", filter);
    const totalBooks = await Book.countDocuments(filter);
    console.log("📊 Total books found:", totalBooks);

    const books = await Book.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    console.log("📚 Books retrieved:", books.length);

    // Ensure all books have stock and availableStock values
    const booksWithStock = await Promise.all(books.map(async (book) => {
      const bookObj = book.toObject();
      let needsUpdate = false;
      
      if (!bookObj.stock) {
        bookObj.stock = 1;
        book.stock = 1;
        needsUpdate = true;
      }
      if (bookObj.availableStock === undefined || bookObj.availableStock === null) {
        bookObj.availableStock = bookObj.stock;
        book.availableStock = bookObj.stock;
        needsUpdate = true;
      }
      
      // Add full image URL
      const imageUrl = getFullImageUrl(bookObj.image);
      bookObj.image = imageUrl;
      
      // Log image status for debugging
      if (!imageUrl) {
        console.warn(`⚠️  Book "${bookObj.title}" has no image URL`);
      }
      
      // Save to database if missing values were set
      if (needsUpdate) {
        await book.save();
      }
      
      return bookObj;
    }));

    console.log(`✅ Returning ${booksWithStock.length} books from page ${page}`);

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
      totalBooks,
      books: booksWithStock
    });

  } catch (err) {
    console.error("❌ Error fetching books:", err.message);
    console.error("❌ Full error:", err);
    res.status(500).json({ error: "Error fetching books: " + err.message });
  }
});

router.put('/archive/:id', async (req, res) => {
  console.log("PUT /archive/:id called with ID:", req.params.id, "Body:", req.body);

  try {
    const bookId = req.params.id;
    console.log("🔍 Looking for book with ID:", bookId);
    
    // Find the book
    const book = await Book.findById(bookId);
    console.log("📚 Book found:", book ? `${book.title}` : 'NOT FOUND');

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Only handle archive status
    if (req.body.status !== 'Archived') {
      // Regular status update
      book.status = req.body.status;
      await book.save();
      return res.status(200).json({
        message: 'Book status updated successfully',
        updatedBook: book,
      });
    }

    // ARCHIVE LOGIC
    console.log("🗂️ Archiving book:", book.title);
    
    // Prepare data for archiving
    const genreValue = book.category || book.genre || 'Unknown';
    let yearValue = book.year;
    
    // Validate year
    if (!yearValue || isNaN(yearValue)) {
      console.warn("⚠️ Invalid year value, using current year");
      yearValue = new Date().getFullYear();
    } else {
      yearValue = parseInt(yearValue);
      // Ensure year is within valid range
      if (yearValue < 1000) {
        console.warn("⚠️ Year too low, setting to 1000");
        yearValue = 1000;
      }
      if (yearValue > new Date().getFullYear() + 50) {
        console.warn("⚠️ Year too high, setting to current year");
        yearValue = new Date().getFullYear();
      }
    }
    
    // Validate title
    const titleValue = (book.title && book.title.trim()) ? book.title : `Book ${book._id.toString().slice(-6)}`;
    
    console.log("📋 Archive data:");
    console.log("  - Title:", titleValue, "(type:", typeof titleValue + ")");
    console.log("  - Year:", yearValue, "(type:", typeof yearValue + ")");
    console.log("  - Genre:", genreValue, "(type:", typeof genreValue + ")");
    console.log("  - Author:", book.author || 'Unknown');
    console.log("  - Publisher:", book.publisher || '');
    console.log("  - Category:", book.category || '');
    console.log("  - Image:", book.image || null);
    console.log("  - Accession:", book.accessionNumber || '');
    console.log("  - CallNumber:", book.callNumber || '');
    console.log("  - Location:", book.location);
    
    // Create archived book
    // Note: Make sure to provide only the fields needed, avoid extra properties
    const archivedBook = new ArchivedBook({
      title: titleValue,
      year: yearValue,
      author: book.author || 'Unknown',
      publisher: book.publisher || '',
      category: book.category || '',
      genre: genreValue,
      image: book.image || null,
      accessionNumber: book.accessionNumber ? book.accessionNumber.trim() : '',
      callNumber: book.callNumber ? book.callNumber.trim() : '',
      location: book.location && typeof book.location === 'object' ? {
        genreCode: book.location.genreCode || undefined,
        shelf: book.location.shelf || undefined,
        level: book.location.level || undefined
      } : {},
      status: 'Archived',
      archivedAt: new Date(),
      originalBookId: book._id
    });

    // Validate before saving
    console.log("🔍 Validating archived book object...");
    console.log("🔍 ArchivedBook data before validation:", {
      title: archivedBook.title,
      year: archivedBook.year,
      genre: archivedBook.genre,
      author: archivedBook.author
    });
    
    const validationError = archivedBook.validateSync();
    if (validationError) {
      console.error("❌ Validation failed:", validationError.errors);
      const errors = Object.keys(validationError.errors).map(k => 
        `${k}: ${validationError.errors[k].message}`
      ).join('; ');
      console.error("❌ Detailed validation errors:", errors);
      console.error("❌ Object being validated:", JSON.stringify({
        title: archivedBook.title,
        year: archivedBook.year,
        genre: archivedBook.genre,
        author: archivedBook.author,
        accessionNumber: archivedBook.accessionNumber,
        callNumber: archivedBook.callNumber,
        location: archivedBook.location
      }, null, 2));
      return res.status(400).json({ 
        error: `Validation failed: ${errors}`,
        details: validationError.errors,
        bookData: {
          title: archivedBook.title,
          year: archivedBook.year,
          genre: archivedBook.genre
        }
      });
    }

    console.log("💾 Saving archived book...");
    try {
      await archivedBook.save();
      console.log("✅ Archived book saved:", archivedBook._id);
    } catch (saveErr) {
      console.error("❌ Save error:", saveErr.message);
      console.error("❌ Save error full:", saveErr);
      console.error("❌ Error code:", saveErr.code);
      console.error("❌ Error name:", saveErr.name);
      if (saveErr.errors) {
        console.error("❌ Mongoose validation errors on save:");
        Object.keys(saveErr.errors).forEach(field => {
          console.error(`  - ${field}: ${saveErr.errors[field].message}`);
        });
      }
      // Return detailed error response
      let errorDetails = saveErr.message;
      if (saveErr.errors) {
        errorDetails = Object.keys(saveErr.errors).map(k => 
          `${k}: ${saveErr.errors[k].message}`
        ).join('; ');
      }
      return res.status(500).json({
        error: `Failed to save archived book: ${errorDetails}`,
        errorType: saveErr.name,
        errorCode: saveErr.code
      });
    }

    // Delete original book
    console.log("🗑️ Deleting original book...");
    try {
      await Book.findByIdAndDelete(bookId);
      console.log("✅ Original book deleted");
    } catch (deleteErr) {
      console.error("❌ Delete error:", deleteErr.message);
      throw deleteErr;
    }

    // Log the action (non-critical)
    try {
      await new Log({
        userEmail: req.body.userEmail || 'admin',
        action: `Archived book: ${book.title} (Accession: ${book.accessionNumber})`
      }).save();
    } catch (logErr) {
      console.warn("⚠️ Log creation failed (non-critical):", logErr.message);
    }

  } catch (err) {
    console.error("❌ Archive route error:", err.message);
    console.error("❌ Full error object:", err);
    console.error("❌ Error name:", err.name);
    console.error("❌ Error code:", err.code);
    
    // Detailed logging for different error types
    if (err.errors) {
      console.error("❌ Mongoose validation errors:");
      Object.keys(err.errors).forEach(field => {
        console.error(`  - ${field}: ${err.errors[field].message}`);
      });
    }
    
    if (err.stack) {
      console.error("❌ Stack trace:", err.stack);
    }
    
    // Build detailed error message
    let errorMsg = err.message || 'Unknown error';
    let detailedErrors = {};
    
    if (err.errors) {
      detailedErrors = Object.keys(err.errors).map(field => 
        `${field}: ${err.errors[field].message}`
      ).join('; ');
    }
    
    console.error("❌ Final error message:", errorMsg);
    console.error("❌ Detailed errors:", detailedErrors);
    
    res.status(500).json({ 
      error: errorMsg || 'Error archiving book',
      type: err.name,
      code: err.code,
      details: detailedErrors || err.message,
      debugInfo: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        errors: err.errors,
        stack: err.stack?.split('\n').slice(0, 5)
      } : undefined
    });
  }
});


// Admin endpoint to cleanup orphaned transactions and reservations
router.post('/admin/cleanup-orphaned', async (req, res) => {
  try {
    console.log("🧹 Starting cleanup of orphaned references...");
    
    let deletedCount = 0;
    
    // Delete transactions referencing non-existent books
    const allTransactions = await Transaction.find({});
    for (const transaction of allTransactions) {
      const book = await Book.findById(transaction.bookId);
      if (!book) {
        await Transaction.findByIdAndDelete(transaction._id);
        deletedCount++;
        console.log(`🗑️ Deleted orphaned transaction for book ${transaction.bookId}`);
      }
    }
    
    // Delete reserved books referencing non-existent books
    const allReserved = await ReservedBook.find({});
    for (const reserved of allReserved) {
      const book = await Book.findById(reserved.bookId);
      if (!book) {
        await ReservedBook.findByIdAndDelete(reserved._id);
        deletedCount++;
        console.log(`🗑️ Deleted orphaned reservation for book ${reserved.bookId}`);
      }
    }
    
    console.log(`✅ Cleanup complete. Deleted ${deletedCount} orphaned records`);
    
    res.status(200).json({
      message: 'Cleanup completed successfully',
      deletedCount
    });
  } catch (err) {
    console.error('❌ Cleanup error:', err);
    res.status(500).json({ error: 'Cleanup error: ' + err.message });
  }
});

// Diagnostic endpoint to check books with missing required fields
router.get('/diagnostic/missing-fields', async (req, res) => {
  try {
    console.log("🔍 Checking for books with missing required fields...");
    
    const books = await Book.find({});
    const issuesFound = [];
    
    books.forEach(book => {
      const issues = [];
      
      if (!book.title || book.title.trim() === '') {
        issues.push('missing title');
      }
      
      if (!book.year || isNaN(book.year) || book.year < 1000 || book.year > new Date().getFullYear() + 50) {
        issues.push(`invalid year: ${book.year}`);
      }
      
      if (!book.category && !book.genre) {
        issues.push('missing category/genre');
      }
      
      if (issues.length > 0) {
        issuesFound.push({
          _id: book._id,
          title: book.title || 'NO TITLE',
          year: book.year,
          category: book.category,
          genre: book.genre,
          issues
        });
      }
    });
    
    console.log(`✅ Found ${issuesFound.length} books with issues out of ${books.length} total`);
    
    res.status(200).json({
      totalBooks: books.length,
      booksWithIssues: issuesFound.length,
      issues: issuesFound
    });
  } catch (err) {
    console.error('❌ Diagnostic error:', err);
    res.status(500).json({ error: 'Diagnostic error: ' + err.message });
  }
});

// Admin endpoint to fix books with missing required data
router.post('/admin/fix-missing-fields', async (req, res) => {
  try {
    console.log("🔧 Starting repair of books with missing fields...");
    
    const books = await Book.find({});
    let fixedCount = 0;
    const failures = [];
    
    for (const book of books) {
      let needsUpdate = false;
      
      // Fix missing/invalid title
      if (!book.title || book.title.trim() === '') {
        console.warn(`⚠️ Book ${book._id} has no title, using ID as title`);
        book.title = `Book ${book._id.toString().slice(-6)}`;
        needsUpdate = true;
      }
      
      // Fix missing/invalid year
      if (!book.year || isNaN(book.year) || book.year < 1000 || book.year > new Date().getFullYear() + 50) {
        const oldYear = book.year;
        book.year = new Date().getFullYear();
        console.warn(`⚠️ Book "${book.title}" had invalid year ${oldYear}, set to ${book.year}`);
        needsUpdate = true;
      }
      
      // Fix missing category/genre
      if (!book.category && !book.genre) {
        book.category = 'General';
        book.genre = 'General';
        console.warn(`⚠️ Book "${book.title}" had no category, set to General`);
        needsUpdate = true;
      }
      
      // Ensure stock values
      if (!book.stock || book.stock < 1) {
        book.stock = 1;
        needsUpdate = true;
      }
      
      if (book.availableStock === undefined || book.availableStock === null) {
        book.availableStock = book.stock;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await book.save();
        fixedCount++;
        console.log(`✅ Fixed book: ${book.title}`);
      }
    }
    
    console.log(`✅ Repair complete. Fixed ${fixedCount} books`);
    
    res.status(200).json({
      message: 'Books repaired successfully',
      totalBooks: books.length,
      booksFixed: fixedCount,
      failures
    });
  } catch (err) {
    console.error('❌ Repair error:', err);
    res.status(500).json({ error: 'Repair error: ' + err.message });
  }
});

// Return book
router.put('/return/:id', async (req, res) => {
  console.log("PUT /return/:id", req.body);
  try {
    const { userEmail } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Find only the transaction for this specific user
    const transaction = await Transaction.findOne({
      bookId: book._id,
      userEmail: userEmail,
      status: { $in: ['active', 'borrowed'] },
      type: 'borrow'
    });

    if (!transaction) {
      return res.status(404).json({ message: 'No active transaction found for this user and book' });
    }

    console.log(`Updating transaction ${transaction._id} for user ${userEmail}`);

    // Update only this transaction
    transaction.status = 'completed';
    transaction.returnDate = new Date();
    await transaction.save();

    // Log the action
    await new Log({
      userEmail: transaction.userEmail,
      action: `Returned book: ${book.title}`
    }).save();

    // Update book status - increment availableStock since it was borrowed
    book.availableStock = (book.availableStock || 0) + 1;
    console.log(`Incrementing stock for book from ${(book.availableStock || 0) - 1} to ${book.availableStock}`);
    
    // Only clear borrowedBy if there are no more active transactions for this book
    const remainingTransactions = await Transaction.findOne({
      bookId: book._id,
      status: { $in: ['active', 'borrowed'] },
      type: 'borrow'
    });

    if (!remainingTransactions) {
      book.borrowedBy = null;
      book.borrowedAt = null;
    }
    
    await book.save();

    console.log(`Return successful for book ${book._id} by user ${userEmail}`);
    res.json({
      message: 'Book returned successfully',
      book,
      transaction
    });
  } catch (err) {
    console.error('Error returning book:', err);
    res.status(500).json({ message: err.message });
  }
});

// 🔧 FIXED: Unarchive book (return archived book to stocks)
router.put('/archived/return/:id', async (req, res) => {
  try {
    const archivedBook = await ArchivedBook.findById(req.params.id);
    if (!archivedBook) return res.status(404).json({ error: 'Archived book not found' });

    // Create new book in main collection with all archived data
    const book = new Book({
      title: archivedBook.title,
      year: archivedBook.year,
      author: archivedBook.author,
      publisher: archivedBook.publisher,
      category: archivedBook.category,
      accessionNumber: archivedBook.accessionNumber,
      callNumber: archivedBook.callNumber,
      location: archivedBook.location,
      image: archivedBook.image,
      archived: false,
      borrowedAt: null,
      borrowedBy: null,
      dueDate: null,
      reservedBy: null,
      reservedAt: null,
      reserveUntil: null,
      status: 'Available',
      stock: 1,
      availableStock: 1
    });

    await book.save();
    await ArchivedBook.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Book returned to stocks!', book });
  } catch (err) {
    console.error("Error unarchiving book:", err);
    res.status(500).json({ error: 'Error returning book to stock' });
  }
});

// Mark book as borrowed
router.put('/borrow/:id', async (req, res) => {
  try {
    const { userEmail } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if there are available copies
    const availableStock = book.availableStock || book.stock || 0;
    if (availableStock <= 0) {
      return res.status(400).json({ message: 'Book is not available' });
    }

    // Create a new transaction
    const transaction = new Transaction({
      bookId: book._id,
      userEmail,
      type: 'borrow',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      bookTitle: book.title
    });

    // Update book status - decrement available stock
    book.borrowedBy = userEmail;
    book.borrowedAt = new Date();
    book.availableStock = (book.availableStock || book.stock || 0) - 1;

    await Promise.all([
      transaction.save(),
      book.save(),
      new Log({
        userEmail,
        action: `Borrowed book: ${book.title}`
      }).save()
    ]);

    res.json({ message: 'Book borrowed successfully', book, transaction });
  } catch (err) {
    console.error('Error borrowing book:', err);
    res.status(500).json({ message: err.message });
  }
});

// Reserve a book
router.post('/reserve/:id', async (req, res) => {
  try {
    const { userEmail } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if book is already reserved
    const existingReservation = await Transaction.findOne({
      bookId: book._id,
      type: 'reserve',
      status: 'active'
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'Book is already reserved' });
    }

    // Create a new transaction
    const transaction = new Transaction({
      bookId: book._id,
      userEmail,
      type: 'reserve',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days reservation
      bookTitle: book.title
    });

    // Also create ReservedBook entry and log errors if any
    await Promise.all([
      transaction.save(),
      new Log({
        userEmail,
        action: `Reserved book: ${book.title}`
      }).save(),
      (async () => {
        try {
          await ReservedBook.create({
            bookId: book._id,
            userEmail,
            bookTitle: book.title,
            reservedAt: new Date(),
            transactionId: transaction._id
          });
        } catch (err) {
          console.error('Error creating ReservedBook:', err);
        }
      })()
    ]);

    res.json({ message: 'Book reserved successfully', transaction });
  } catch (err) {
    console.error('Error reserving book:', err);
    res.status(500).json({ message: err.message });
  }
});

// Cancel a reservation
router.put('/cancel-reservation/:id', async (req, res) => {
  try {
    const { userEmail } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Find the active reservation for this book and user
    const reservation = await Transaction.findOne({
      bookId: book._id,
      userEmail,
      type: 'reserve',
      status: 'active'
    });

    if (!reservation) {
      return res.status(404).json({ message: 'No active reservation found for this book' });
    }

    // Update reservation status
    reservation.status = 'cancelled';
    reservation.returnDate = new Date();
    await reservation.save();

    // Log the cancellation
    await new Log({
      userEmail,
      action: `Cancelled reservation for book: ${book.title}`
    }).save();

    res.json({
      message: 'Reservation cancelled successfully',
      book
    });
  } catch (err) {
    console.error('Error cancelling reservation:', err);
    res.status(500).json({ message: err.message });
  }
});

// Stats: Books added today
router.get('/stats/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await Book.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    res.status(200).json({ todayCount });
  } catch (err) {
    console.error("Error getting today's count:", err);
    res.status(500).json({ error: 'Server error while counting books added today' });
  }
});

// Stats: Books borrowed in last 7 days
router.get('/stats/borrowed-week', async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const borrowedWeekCount = await Transaction.countDocuments({
      type: 'borrow',
      status: { $in: ['active', 'completed'] },
      startDate: { $gte: sevenDaysAgo }
    });

    const weekTransactions = await Transaction.find({
      type: 'borrow',
      status: { $in: ['active', 'completed'] },
      startDate: { $gte: sevenDaysAgo }
    }).populate('bookId').sort({ startDate: -1 });

    const books = weekTransactions
      .filter(t => t.bookId) // Filter out transactions with null bookId
      .map(t => ({
        _id: t.bookId._id,
        title: t.bookId.title,
        author: t.bookId.author,
        category: t.bookId.category,
        image: t.bookId.image,
        borrowedBy: t.userEmail,
        borrowedAt: t.startDate,
        dueDate: t.endDate
      }));

    res.status(200).json({ borrowedWeekCount, books });
  } catch (err) {
    console.error("Error getting borrowed books count for the week:", err);
    res.status(500).json({ error: 'Server error while counting borrowed books this week' });
  }
});

// Stats: Books borrowed today
router.get('/stats/borrowed-today', async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayTransactions = await Transaction.find({
      type: 'borrow',
      status: { $in: ['active', 'completed'] },
      startDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('bookId').sort({ startDate: -1 });

    const books = todayTransactions
      .filter(t => t.bookId) // Filter out transactions with null bookId
      .map(t => ({
        _id: t.bookId._id,
        title: t.bookId.title,
        author: t.bookId.author,
        category: t.bookId.category,
        image: t.bookId.image,
        borrowedBy: t.userEmail,
        borrowedAt: t.startDate,
        dueDate: t.endDate
      }));

    res.status(200).json({ books, count: books.length });
  } catch (err) {
    console.error("Error getting borrowed books for today:", err);
    res.status(500).json({ error: 'Server error while fetching today borrowed books' });
  }
});

// Stats: Books borrowed in last 30 days
router.get('/stats/borrowed-month', async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthTransactions = await Transaction.find({
      type: 'borrow',
      status: { $in: ['active', 'completed'] },
      startDate: { $gte: thirtyDaysAgo }
    }).populate('bookId').sort({ startDate: -1 });

    const books = monthTransactions
      .filter(t => t.bookId) // Filter out transactions with null bookId
      .map(t => ({
        _id: t.bookId._id,
        title: t.bookId.title,
        author: t.bookId.author,
        category: t.bookId.category,
        image: t.bookId.image,
        borrowedBy: t.userEmail,
        borrowedAt: t.startDate,
        dueDate: t.endDate
      }));

    res.status(200).json({ books, count: books.length });
  } catch (err) {
    console.error("Error getting borrowed books for the month:", err);
    res.status(500).json({ error: 'Server error while fetching month borrowed books' });
  }
});

// Stats: Most borrowed books (all time)
router.get('/stats/most-borrowed', async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    
    // Aggregate transactions to count borrows per book
    const mostBorrowedBooks = await Transaction.aggregate([
      {
        $match: { type: 'borrow' } // Only count borrow transactions
      },
      {
        $group: {
          _id: '$bookId',
          borrowCount: { $sum: 1 },
          bookTitle: { $first: '$bookTitle' }
        }
      },
      {
        $sort: { borrowCount: -1 }
      },
      {
        $limit: 10 // Top 10 most borrowed
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookDetails'
        }
      },
      {
        $unwind: {
          path: '$bookDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    // Format the response
    const formattedBooks = mostBorrowedBooks.map(item => ({
      _id: item._id,
      title: item.bookDetails?.title || item.bookTitle,
      author: item.bookDetails?.author || 'Unknown',
      category: item.bookDetails?.category || 'Unknown',
      image: item.bookDetails?.image || null,
      borrowCount: item.borrowCount,
      year: item.bookDetails?.year,
      stock: item.bookDetails?.stock,
      availableStock: item.bookDetails?.availableStock
    }));

    res.status(200).json({ 
      mostBorrowedBooks: formattedBooks,
      totalBooks: formattedBooks.length
    });
  } catch (err) {
    console.error("Error getting most borrowed books:", err);
    res.status(500).json({ error: 'Server error while fetching most borrowed books' });
  }
});

// 🔧 FIXED: Delete a book permanently (checks both collections)
router.delete('/:id', async (req, res) => {
  try {
    // Try to delete from regular books first
    let deletedBook = await Book.findByIdAndDelete(req.params.id);

    // If not found in regular books, try archived books
    if (!deletedBook) {
      deletedBook = await ArchivedBook.findByIdAndDelete(req.params.id);
    }

    if (!deletedBook) {
      return res.status(404).json({ error: 'Book not found in any collection' });
    }

    res.status(200).json({ message: 'Book deleted successfully', book: deletedBook });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ error: 'Error deleting book' });
  }
});

// Get all borrowed books
router.get('/borrowed', async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    // Get only ACTIVE/BORROWED borrow transactions
    const borrowedTransactions = await Transaction.find({
      type: 'borrow',
      status: { $in: ['active', 'borrowed'] }
    }).populate('bookId');

    console.log(`Found ${borrowedTransactions.length} active borrow transactions`);
    borrowedTransactions.forEach((t, idx) => {
      console.log(`Transaction ${idx}: status=${t.status}, userEmail=${t.userEmail}, bookId=${t.bookId?._id}`);
    });

    // Show only active/borrowed borrow transactions
    const books = borrowedTransactions
      .filter(t => t.bookId) // Only include if bookId populated successfully
      .map(t => ({
        _id: t.bookId._id,
        title: t.bookId.title,
        author: t.bookId.author,
        category: t.bookId.category,
        image: t.bookId.image,
        borrowedBy: t.userEmail,
        borrowedAt: t.startDate,
        dueDate: t.endDate,
        status: t.status
      }));

    console.log(`Returning ${books.length} books`);
    res.status(200).json({ books });
  } catch (err) {
    console.error("Error fetching borrowed books:", err);
    res.status(500).json({ error: "Error fetching borrowed books" });
  }
});

// Get all archived books
router.get('/archived/all', async (req, res) => {
  try {
    console.log("📚 Fetching all archived books...");
    const archivedBooks = await ArchivedBook.find().sort({ archivedAt: -1 });
    console.log(`✅ Found ${archivedBooks.length} archived books`);
    res.status(200).json({ books: archivedBooks });
  } catch (err) {
    console.error("❌ Error fetching archived books:", err);
    res.status(500).json({ error: "Error fetching archived books: " + err.message });
  }
});

// Delete an archived book permanently
router.delete('/archived/:id', async (req, res) => {
  try {
    console.log("🗑️ Deleting archived book with ID:", req.params.id);
    const deletedBook = await ArchivedBook.findByIdAndDelete(req.params.id);
    
    if (!deletedBook) {
      console.log("❌ Archived book not found with ID:", req.params.id);
      return res.status(404).json({ error: 'Archived book not found' });
    }
    
    console.log("✅ Archived book deleted:", deletedBook.title);
    res.status(200).json({ 
      message: 'Archived book deleted successfully',
      deletedBook: {
        _id: deletedBook._id,
        title: deletedBook.title
      }
    });
  } catch (err) {
    console.error("❌ Error deleting archived book:", err);
    res.status(500).json({ error: 'Error deleting archived book: ' + err.message });
  }
});

// Get all reserved books
router.get('/reserved', async (req, res) => {
  try {
    const reservedBooks = await Book.find({ reservedBy: { $ne: null } });
    res.status(200).json({ books: reservedBooks });
  } catch (err) {
    console.error("Error fetching reserved books:", err);
    res.status(500).json({ error: "Error fetching reserved books" });
  }
});

// Update book details
router.put('/update/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, year, genre } = req.body;

    const updateData = {
      title,
      year,
      genre
    };

    // Only update image if a new one is uploaded
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json({ message: 'Book updated successfully', book: updatedBook });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ error: 'Error updating book' });
  }
});

// Borrow a reserved book
router.put('/borrow-reserved/:id', async (req, res) => {
  try {
    const { userEmail, reservationId } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Verify the reservation
    const reservation = await Transaction.findOne({
      _id: reservationId,
      bookId: book._id,
      userEmail,
      type: 'reserve',
      status: 'active'
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Active reservation not found' });
    }

    // Check if it's the reserved date
    const today = new Date();
    const reserveDate = new Date(reservation.startDate);
    if (today.toDateString() !== reserveDate.toDateString()) {
      return res.status(400).json({
        message: 'This book can only be borrowed on the reserved date'
      });
    }

    // Mark the reservation as completed
    reservation.status = 'completed';
    await reservation.save();

    // Create new borrow transaction
    const borrowTransaction = new Transaction({
      bookId: book._id,
      userEmail,
      type: 'borrow',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      bookTitle: book.title
    });

    // Update book status
    book.borrowedBy = userEmail;
    book.borrowedAt = new Date();

    await Promise.all([
      borrowTransaction.save(),
      book.save(),
      new Log({
        userEmail,
        action: `Borrowed reserved book: ${book.title}`
      }).save()
    ]);

    res.json({
      message: 'Reserved book borrowed successfully',
      book,
      transaction: borrowTransaction
    });
  } catch (err) {
    console.error('Error borrowing reserved book:', err);
    res.status(500).json({ message: err.message });
  }
});

// Cleanup: Return books from deleted users
router.post('/cleanup/return-deleted-users', async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Find all active borrow transactions
    const activeTransactions = await Transaction.find({
      type: 'borrow',
      status: 'active'
    });

    console.log(`Found ${activeTransactions.length} active borrow transactions`);

    let returnedCount = 0;
    let skippedCount = 0;

    // Check each transaction's user
    for (const transaction of activeTransactions) {
      const userExists = await User.findOne({ email: transaction.userEmail });
      
      if (!userExists) {
        // User has been deleted, return the book
        console.log(`User ${transaction.userEmail} not found, returning book ${transaction.bookId}`);
        
        const book = await Book.findById(transaction.bookId);
        if (book) {
          // Increment availableStock since it was borrowed
          book.availableStock = (book.availableStock || 0) + 1;
          book.borrowedBy = null;
          book.borrowedAt = null;
          await book.save();
        }

        // Mark transaction as completed
        transaction.status = 'completed';
        transaction.returnDate = new Date();
        await transaction.save();

        // Log the action
        await new Log({
          userEmail: 'system',
          action: `Auto-returned book from deleted user: ${transaction.bookTitle} (was borrowed by ${transaction.userEmail})`
        }).save();

        returnedCount++;
      } else {
        skippedCount++;
      }
    }

    res.json({
      message: `Cleanup completed. Returned ${returnedCount} books from deleted users.`,
      returnedCount,
      skippedCount
    });
  } catch (err) {
    console.error('Error in cleanup:', err);
    res.status(500).json({ message: err.message });
  }
});

// Diagnostic endpoint to check image URLs
router.get('/diagnostic/images', async (req, res) => {
  try {
    const books = await Book.find({ archived: false }).limit(5).select('title image category');
    
    const diagnostics = books.map(book => ({
      title: book.title,
      category: book.category,
      imageField: book.image,
      imageUrl: getFullImageUrl(book.image),
      isValid: book.image ? true : false
    }));
    
    res.json({
      message: 'Image URL Diagnostics',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      books: diagnostics
    });
  } catch (err) {
    console.error('Diagnostic error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to fix accession numbers for existing books using Counter model
router.post('/admin/fix-accession-numbers', async (req, res) => {
  try {
    // Reset the counter
    await Counter.findOneAndUpdate(
      { name: 'accessionNumber' },
      { value: 0 },
      { upsert: true }
    );
    
    // Get all books, sorted by creation date
    const books = await Book.find({}).sort({ createdAt: 1 });
    
    console.log(`📚 Fixing accession numbers for ${books.length} books`);
    
    let counter = 0;
    const currentYear = new Date().getFullYear();
    const updatePromises = [];
    
    for (const book of books) {
      counter++;
      const sequenceNumber = String(counter).padStart(4, '0');
      const newAccessionNumber = `${currentYear}-${sequenceNumber}`;
      updatePromises.push(
        Book.findByIdAndUpdate(book._id, { accessionNumber: newAccessionNumber })
      );
    }
    
    await Promise.all(updatePromises);
    
    // Update counter to reflect the fixed numbers
    await Counter.findOneAndUpdate(
      { name: 'accessionNumber' },
      { value: counter }
    );
    
    console.log("✅ Fixed accession numbers for", counter, "books in DDC format");
    
    res.json({
      message: 'Accession numbers fixed successfully in DDC format (YYYY-XXXX)',
      booksFixed: counter,
      format: `${currentYear}-0001 to ${currentYear}-${String(counter).padStart(4, '0')}`
    });
  } catch (err) {
    console.error('❌ Error fixing accession numbers:', err);
    res.status(500).json({ error: 'Failed to fix accession numbers: ' + err.message });
  }
});

// Endpoint to assign accession numbers to books that don't have one
router.post('/admin/assign-accession-numbers', async (req, res) => {
  try {
    console.log("🔢 Assigning accession numbers to books without them...");
    
    // Find all books without accession numbers
    const booksWithoutAccession = await Book.find({ 
      $or: [
        { accessionNumber: null },
        { accessionNumber: undefined },
        { accessionNumber: '' }
      ]
    });
    
    console.log(`📚 Found ${booksWithoutAccession.length} books without accession numbers`);
    
    let assignedCount = 0;
    for (const book of booksWithoutAccession) {
      try {
        const accessionNumber = await getNextAccessionNumber();
        book.accessionNumber = accessionNumber;
        await book.save();
        assignedCount++;
        console.log(`✅ Assigned ${accessionNumber} to ${book.title}`);
      } catch (err) {
        console.error(`❌ Failed to assign accession number to ${book.title}:`, err.message);
      }
    }
    
    console.log(`✅ Successfully assigned accession numbers to ${assignedCount} books`);
    
    res.json({
      message: 'Accession numbers assigned successfully',
      booksUpdated: assignedCount,
      totalBooksWithoutAccession: booksWithoutAccession.length
    });
  } catch (err) {
    console.error('❌ Error assigning accession numbers:', err);
    res.status(500).json({ error: 'Failed to assign accession numbers: ' + err.message });
  }
});

// Endpoint to fix all books and assign accession numbers in order
router.post('/admin/fix-all-accessions', async (req, res) => {
  try {
    console.log("🔧 Fixing all books - assigning sequential accession numbers...");
    
    // Get all books sorted by creation date (oldest first)
    const allBooks = await Book.find()
      .sort({ createdAt: 1 })
      .exec();
    
    console.log(`📚 Found ${allBooks.length} total books`);
    
    const currentYear = new Date().getFullYear();
    let sequenceCounter = 0;
    let updatedCount = 0;
    
    for (const book of allBooks) {
      sequenceCounter++;
      const accessionNumber = `${currentYear}-${String(sequenceCounter).padStart(4, '0')}`;
      book.accessionNumber = accessionNumber;
      
      try {
        await book.save();
        console.log(`✅ Updated ${book.title} with accession: ${accessionNumber}`);
        updatedCount++;
      } catch (err) {
        console.error(`❌ Failed to update ${book.title}:`, err.message);
      }
    }
    
    console.log(`✅ Fixed accession numbers for ${updatedCount}/${allBooks.length} books`);
    
    res.json({
      message: 'All books have been assigned sequential accession numbers',
      totalBooks: allBooks.length,
      booksUpdated: updatedCount,
      format: `${currentYear}-0001 to ${currentYear}-${String(sequenceCounter).padStart(4, '0')}`
    });
  } catch (err) {
    console.error('❌ Error fixing all accession numbers:', err);
    res.status(500).json({ error: 'Failed to fix accession numbers: ' + err.message });
  }
});

// Ultra-simple endpoint - just assign numbers to all books in order
router.get("/quick-fix-accessions", async (req, res) => {
  try {
    const allBooks = await Book.find().sort({ createdAt: 1 });
    const year = new Date().getFullYear();
    
    for (let i = 0; i < allBooks.length; i++) {
      const num = i + 1;
      allBooks[i].accessionNumber = `${year}-${String(num).padStart(4, '0')}`;
      await allBooks[i].save();
    }
    
    res.json({ success: true, updated: allBooks.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

