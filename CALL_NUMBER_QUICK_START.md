# 🚀 Call Number Auto-Generation - Quick Start

## What's New?

✨ **Call numbers are now auto-generated using DDC format!**

No more manual entry. Books automatically get professional, standardized call numbers when you add them.

## Format: DDD-II-SSSS

- **DDD** = Dewey Decimal Code (e.g., 500 for Science)
- **II** = Author Initials (e.g., JR for J.K. Rowling)  
- **SSSS** = Sequence Number (e.g., 0001)

## Example

When you add this book:
```
Title: Harry Potter and the Philosopher's Stone
Author: J.K. Rowling
Category: Fiction
```

It automatically gets:
```
Call Number: 800-JR-0001
```

## Using It

### Add a Book
1. Go to **Admin Dashboard → Add Book**
2. Fill required fields (Title, Author, Category, etc.)
3. **See call number preview update in real-time**
4. Click **Add Book** - done!

### View Call Numbers
- **Books Table** - visible in the Call Number column
- **Book Details** - shown in book information
- **Excel Export** - included in exports

## Category Mapping

| Category | Code | Category | Code |
|----------|------|----------|------|
| Science | 500 | English | 820 |
| Math | 510 | Fiction | 800 |
| Biology | 570 | History | 900 |
| Technology | 600 | Philosophy | 100 |
| Medicine | 610 | Psychology | 150 |

[See full list in DDC_CALL_NUMBER_GUIDE.md]

## Files Modified

✅ `backend/utils/ddc.js` - NEW: DDC utility
✅ `backend/routes/bookRoutes.js` - Auto-generation logic
✅ `src/pages/AddBook.js` - Real-time preview
✅ `src/components/BooksTable.js` - Read-only display

## Test It

Run: `node backend/testCallNumberGeneration.js`

Or manually test by adding a book and checking the generated call number.

## Benefits

✅ **Automatic** - No manual work
✅ **Standardized** - Uses DDC worldwide standard
✅ **Consistent** - Same format always
✅ **Professional** - Meets library best practices
✅ **Reliable** - With fallback system

## Read Full Docs

- 📖 **DDC_CALL_NUMBER_GUIDE.md** - Complete documentation
- ✅ **CALL_NUMBER_AUTO_GENERATION_COMPLETE.md** - Implementation details

---

**Status:** ✅ Ready to Use
**Format:** DDC (Dewey Decimal Classification)
**Implementation Date:** January 22, 2026
