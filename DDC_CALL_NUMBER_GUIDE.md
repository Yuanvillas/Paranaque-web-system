# 📚 DDC Call Number Auto-Generation Guide

## Overview

The library system now automatically generates **Dewey Decimal Classification (DDC)** formatted call numbers for all books. This replaces the previous manual entry system and ensures consistent, standardized cataloging.

## What is DDC?

The **Dewey Decimal Classification** is a widely-used library cataloging system that:
- Assigns numerical codes to different knowledge areas
- Makes books easy to locate on shelves
- Is recognized globally by libraries

## Format

Call numbers are now auto-generated in the format: **DDD-II-SSSS**

- **DDD** = Dewey Decimal Code (3 digits)
  - 000-099: General Knowledge
  - 100-199: Philosophy & Psychology
  - 200-299: Religion
  - 300-399: Social Sciences
  - 500-599: Natural Sciences & Mathematics
  - 600-699: Technology
  - 700-799: Arts & Recreation
  - 800-899: Literature
  - 900-999: History & Geography

- **II** = Author Initials (2 letters)
  - First letter of first name + first letter of last name
  - Example: J.K. Rowling = JR, Stephen King = SK

- **SSSS** = Sequence Number (4 digits, zero-padded)
  - Incremented for each book by the same author in same category
  - Helps distinguish between multiple books by same author

### Examples

| Category | Author | Call Number |
|----------|--------|------------|
| Science | Albert Einstein | 500-AE-0001 |
| Fiction | J.K. Rowling | 800-JR-0001 |
| Math | Isaac Newton | 510-IN-0001 |
| English | William Shakespeare | 820-WS-0001 |
| History | George Orwell | 900-GO-0001 |

## Category to DDC Mapping

The system maps book categories to DDC codes automatically:

```
Science        → 500
Math           → 510
Filipino       → 820
English        → 820
Fiction        → 800
History        → 900
Biography      → 920
Technology     → 600
Medicine       → 610
Philosophy     → 100
Psychology     → 150
Social Sciences → 300
Religion       → 200
Art            → 700
Music          → 780
Sports         → 790
(Unknown)      → 000
```

## How It Works

### Adding a New Book

1. Go to **Admin Dashboard → Add Book**
2. Fill in required fields:
   - Book Title
   - Author
   - Category
   - Year
   - Stock
   - Location

3. **Call Number is automatically generated** based on:
   - Category (determines DDC code)
   - Author (extracts initials)
   - Number of books with same author in same category (sequence)

4. You'll see a preview of the call number before submission:
   ```
   Call Number (Auto-Generated - DDC Format)
   500-AE-0001
   Based on category and author name (Format: DDD-II-SSSS)
   ```

5. Click **Add Book** - the call number is assigned automatically

### Editing Books

- **Call Number field is read-only** during edits
- If you need to change a call number, you must:
  1. Delete the book
  2. Re-add it with updated category/author information

### Viewing Call Numbers

- Books Table: Call numbers visible in the "Call Number" column
- Book Details: Displayed in book information popups
- Book List: Shown alongside accession numbers

## Backend Implementation

### Files Modified

1. **backend/utils/ddc.js** (NEW)
   - DDC mapping table
   - `getDDCCode(category)` - Get DDC code for category
   - `getAuthorInitials(author)` - Extract author initials
   - `generateCallNumber(category, author, sequence)` - Generate full call number

2. **backend/routes/bookRoutes.js**
   - Imports DDC utility
   - Auto-generates call numbers in book creation endpoint
   - Falls back gracefully if generation fails

3. **src/pages/AddBook.js**
   - Shows real-time call number preview
   - Preview updates when category or author changes
   - Call number field is disabled (display-only)

4. **src/components/BooksTable.js**
   - Call number field is read-only in edit modal
   - Added explanation text about auto-generation

## API Behavior

### When Creating a Book

**Request:**
```json
POST /api/books
{
  "title": "The Origin of Species",
  "author": "Charles Darwin",
  "category": "Science",
  "year": 1859,
  "stock": 1,
  "location": { "shelf": 1, "level": 1 }
}
```

**Response:**
```json
{
  "message": "Book added successfully!",
  "book": {
    "_id": "...",
    "title": "The Origin of Species",
    "author": "Charles Darwin",
    "category": "Science",
    "accessionNumber": "2026-0001",
    "callNumber": "500-CD-0001",  // ← Auto-generated!
    ...
  }
}
```

### Fallback Behavior

If call number generation fails for any reason:
- System uses format: **{CATEGORY}-{AUTHOR}-0001**
- Example: **Science-Charles-0001**
- Prevents book creation from failing

## Testing

### Manual Testing

1. **Test Adding Books:**
   - Add a Science book by "Albert Einstein"
   - Add an English book by "Jane Austen"
   - Add a Fiction book by "Stephen King"
   - Verify call numbers match expected format

2. **Test Category Matching:**
   - Try variations like "science", "SCIENCE", "Science"
   - Should all map to DDC 500

3. **Test Multiple Books:**
   - Add multiple books by same author in same category
   - Sequence numbers should increment (0001, 0002, 0003, etc.)

### Automated Testing

Run the test script:
```bash
cd backend
node testCallNumberGeneration.js
```

This tests:
- DDC code mapping
- Author initial extraction
- Complete call number generation

## Migration from Old System

### For Existing Books Without Call Numbers

You can generate call numbers for all existing books:

```bash
# Via API endpoint
POST /api/books/admin/generate-call-numbers-for-all

# Expected response:
{
  "message": "Call numbers generated for all books",
  "booksUpdated": 42,
  "format": "DDD-II-SSSS"
}
```

## Common Issues & Solutions

### Issue: Call number shows as "000-ANON-0001"

**Cause:** Category not recognized or author missing
**Solution:** 
- Verify category matches the mapping list
- Ensure author field is filled in
- Check spelling of category name

### Issue: Similar books have same call number

**Cause:** Same author, same category, sequence not incremented properly
**Solution:** 
- System should auto-increment sequence
- If issue persists, regenerate call numbers for that category

### Issue: Call number changed after editing

**Current behavior:** Call numbers are fixed when created and don't change on edit

**To change call number:**
- Delete the book
- Re-add it with correct category/author
- New call number will be generated

## Benefits

✅ **Standardized**: Uses world-recognized DDC system
✅ **Automatic**: No manual entry needed
✅ **Consistent**: Same format for all books
✅ **Efficient**: Reduces data entry errors
✅ **Scalable**: Works with any number of books
✅ **Professional**: Meets library standards

## Future Enhancements

Potential improvements:
- Allow custom category-to-DDC mappings
- Support for more detailed DDC sub-ranges
- Call number management API endpoint
- Batch regeneration of call numbers
- Call number search functionality

## Support

For issues or questions about call numbers:
1. Check this documentation
2. Run the test script to verify system
3. Check browser console for generation errors
4. Verify category and author are filled in correctly

---

**Date Implemented:** January 22, 2026
**Status:** ✅ Active
**Impact:** All new books get DDC call numbers automatically
