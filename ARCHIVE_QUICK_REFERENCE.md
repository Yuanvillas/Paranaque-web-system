# Archive System - Quick Reference Guide

## 🎯 What is the Archive System?

The Archive system allows librarians to remove books from active circulation while preserving their records. This is useful for:
- Books that are damaged or outdated
- Books being temporarily removed from the collection
- Maintaining a history of all books that were ever in the library

## 🔄 Archive Workflow

### How Books Flow Through the System

```
┌──────────────────────────────────────────────────────────────┐
│                    NEW BOOK ADDED                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │   ACTIVE BOOKS        │
           │   (ALL BOOKS Tab)     │
           │   - Can borrow        │
           │   - Can reserve       │
           │   - Visible to users  │
           └───────────┬───────────┘
                       │
              ┌────────┴────────┐
              │ ARCHIVE Button  │
              │ Clicked         │
              └────────┬────────┘
                       ▼
           ┌───────────────────────┐
           │  ARCHIVED BOOKS       │
           │  (ARCHIVE Tab)        │
           │  - Cannot borrow      │
           │  - Hidden from users  │
           │  - Full records kept  │
           └───────────┬───────────┘
                       │
              ┌────────┴────────┐
              │  Two Options:   │
              │ 1. Return       │
              │ 2. Delete       │
              └────┬───────┬────┘
                   │       │
         ┌─────────┘       └──────────┐
         │                            │
         ▼                            ▼
    ┌─────────────┐          ┌──────────────┐
    │   RETURN    │          │   DELETE     │
    │   TO STOCK  │          │ PERMANENTLY  │
    │     Back    │          │  Gone from   │
    │     to      │          │  Database    │
    │   Active    │          │              │
    │   Books     │          │   ⚠️  Cannot  │
    │             │          │   undo!      │
    └─────────────┘          └──────────────┘
```

## 📱 How to Use Archive in Admin Dashboard

### Archiving a Book (ARCHIVE BUTTON)

**Step 1:** Go to Admin Dashboard
```
🏠 Home → Click on Admin Dashboard (icon in sidebar)
```

**Step 2:** Navigate to Resources
```
🏠 Admin Dashboard
├─ Click "Resources" in left menu
└─ You'll see sub-menu: All Books | Archive Books | Borrowed Books | etc.
```

**Step 3:** Archive a Book
```
1. Click "All Books" tab
2. Find the book you want to archive
3. Scroll right to see "Actions" column
4. Click "Archive" button (yellow/gold color)
5. Confirm: "Are you sure you want to archive this book?"
6. Click "Yes"
7. ✅ Book is now archived!
```

### Viewing Archived Books (ARCHIVE BOOKS TAB)

**Step 1:** Go to Resources
```
🏠 Admin Dashboard
├─ Click "Resources" in left menu
└─ You'll see: All Books | Archive Books | Borrowed Books | etc.
```

**Step 2:** Click Archive Books Tab
```
You'll see:
- List of all archived books
- Total count at top
- Search box to find books
- Each book shows: Title | Year | Category | Image | Actions
```

### Returning Archived Book to Active Stock (RETURN BUTTON)

**Step 1:** Open Archive Books tab
```
🏠 Admin Dashboard → Resources → Archive Books
```

**Step 2:** Find the book to restore
```
Use search box to find by title if needed
```

**Step 3:** Click Return Button
```
1. Click blue "↩️ Return" button on the right
2. Confirm: "Are you sure you want to return this book to stocks?"
3. Click "Yes"
4. ✅ Book moves back to "All Books" tab
```

### Permanently Deleting Archived Book (DELETE BUTTON)

**Step 1:** Open Archive Books tab
```
🏠 Admin Dashboard → Resources → Archive Books
```

**Step 2:** Find the book to delete
```
Use search box to find by title if needed
```

**Step 3:** Click Delete Button
```
1. Click red "🗑️ Delete" button on the right
2. Confirm: "Are you sure you want to permanently delete this book?"
3. Click "Yes"
4. ⚠️ Book is permanently deleted! Cannot undo!
```

## 🗄️ Database Structure

### Two Separate Collections

**BOOKS Collection** (Active Books)
```
{
  _id: ObjectId,
  title: "Book Title",
  year: 2023,
  category: "Fiction",
  author: "Author Name",
  status: "available",
  borrowedBy: null,
  reservedBy: null,
  stock: 5,
  availableStock: 3,
  image: "image-url.jpg",
  accessionNumber: "2026-0001",
  createdAt: "2026-01-13T16:55:22Z"
}
```

**ARCHIVED_BOOKS Collection** (Archived Books)
```
{
  _id: ObjectId,
  title: "Book Title",
  year: 2023,
  category: "Fiction",
  author: "Author Name",
  status: "Archived",
  originalBookId: ObjectId (reference),
  image: "image-url.jpg",
  accessionNumber: "2026-0001",
  archivedAt: "2026-01-14T10:30:00Z",  ← When archived
  createdAt: "2026-01-13T16:55:22Z"
}
```

## ⚙️ API Reference

### For Developers/Admins Using API

```bash
# 1. Archive a book
PUT /api/books/archive/:bookId
Content-Type: application/json
{
  "status": "Archived"
}
Response: 200 OK
{
  "message": "Book archived successfully",
  "archivedBook": { ... }
}

# 2. Get all archived books
GET /api/books/archived/all
Response: 200 OK
{
  "books": [ ... ]
}

# 3. Return archived book to stock
PUT /api/books/archived/return/:bookId
Response: 200 OK
{
  "message": "Book returned to stocks!",
  "book": { ... }
}

# 4. Permanently delete archived book
DELETE /api/books/archived/:bookId
Response: 200 OK
{
  "message": "Archived book deleted successfully",
  "deletedBook": { _id, title }
}
```

## 🛡️ Safety Features

### What Gets Preserved
✅ Original book title
✅ Author, publisher, year
✅ Library accession number
✅ Classification/call number
✅ Location information
✅ Archive timestamp
✅ Original book ID (for reference)

### What Gets Removed
❌ Book is removed from active circulation
❌ Book is hidden from users
❌ Book cannot be borrowed or reserved
❌ Book is no longer in "All Books" list

## ⚠️ Important Notes

### Before Archiving
- Make sure book isn't currently borrowed by someone
- Consider returning it first if needed
- Book record will be preserved

### Before Deleting
- **This cannot be undone!**
- Only delete if you're sure the book should be completely removed
- Archived record will be permanently deleted
- Consider keeping in archive instead

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't find Archive button | Scroll right in All Books table |
| Archive button doesn't work | Clear browser cache (Ctrl+F5) |
| Book still visible after archive | Refresh page (F5) |
| Can't return book from archive | Book may have validation issues |
| Delete button missing | Book may be locked |

## 📊 Data Flow Summary

```
User Archives Book
        ↓
    ✅ Validation
        ├─ Title not empty?
        ├─ Year valid (1000-2050)?
        ├─ Category/Genre present?
        └─ All OK? Continue...
        ↓
 Book moved to Archive
        ├─ Saved as ArchivedBook
        ├─ Deleted from Books collection
        └─ Logged in system
        ↓
 Available in Archive View
        ├─ Can be returned to stock
        └─ Can be permanently deleted
```

## ✅ Validation Rules

Books can only be archived if they have:
1. ✅ A title (not empty)
2. ✅ A valid year (between 1000 and current year + 50)
3. ✅ A category or genre

If validation fails, you'll get an error message explaining what's wrong.

---

**Last Updated:** January 14, 2026
**Version:** 1.0
**Status:** ✅ Ready to Use
