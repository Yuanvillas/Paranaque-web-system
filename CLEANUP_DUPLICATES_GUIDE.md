# 🧹 Accession Number Cleanup & Sync Guide

## Problem
You have:
1. **Duplicate books** - Same accession number assigned to multiple books
2. **Counter out of sync** - Counter is at 10, but your highest book is 2026-0050

## Solution
Two new admin endpoints to clean and sync everything:

---

## Step 1: Remove Duplicate Accession Numbers

**What it does:**
- Finds all books with duplicate accession numbers
- Keeps the **first/oldest** copy of each
- Deletes all duplicate copies

**API Endpoint:**
```bash
POST https://paranaque-web-system.onrender.com/api/books/admin/remove-duplicates
```

**How to use:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Paste this code:
```javascript
fetch('https://paranaque-web-system.onrender.com/api/books/admin/remove-duplicates', {
  method: 'POST'
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(e => console.error(e));
```
4. Press Enter
5. Wait for response

**Expected Response:**
```json
{
  "message": "Duplicate accession numbers removed",
  "duplicateGroupsFound": 5,
  "booksDeleted": 12,
  "booksRemaining": 38
}
```

This means:
- ✅ Found 5 accession numbers that had duplicates
- ✅ Deleted 12 duplicate copies
- ✅ Kept 38 books total

---

## Step 2: Sync Counter to Highest Number

**What it does:**
- Finds the highest accession number currently in database (e.g., 2026-0050)
- Sets the counter to that value
- Next book will be 2026-0051 instead of 2026-0010

**API Endpoint:**
```bash
POST https://paranaque-web-system.onrender.com/api/books/admin/sync-counter
```

**How to use:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Paste this code:
```javascript
fetch('https://paranaque-web-system.onrender.com/api/books/admin/sync-counter', {
  method: 'POST'
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(e => console.error(e));
```
4. Press Enter
5. Wait for response

**Expected Response:**
```json
{
  "message": "Counter synced successfully",
  "year": 2026,
  "highestExistingNumber": 50,
  "nextAccessionNumber": "2026-0051",
  "totalBooks": 38
}
```

This means:
- ✅ Highest existing book is 2026-0050
- ✅ Counter now set to 50
- ✅ Next book will be 2026-0051
- ✅ You have 38 books total

---

## Complete Cleanup Procedure

**Run both steps in order:**

### Step 1: Remove Duplicates
```javascript
fetch('https://paranaque-web-system.onrender.com/api/books/admin/remove-duplicates', {
  method: 'POST'
})
.then(r => r.json())
.then(data => {
  console.log('✅ Duplicates Removed:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(e => console.error('❌ Error:', e));
```

### Step 2: Sync Counter
```javascript
fetch('https://paranaque-web-system.onrender.com/api/books/admin/sync-counter', {
  method: 'POST'
})
.then(r => r.json())
.then(data => {
  console.log('✅ Counter Synced:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(e => console.error('❌ Error:', e));
```

### Step 3: Verify Status
```javascript
fetch('https://paranaque-web-system.onrender.com/api/books/admin/counter-status')
.then(r => r.json())
.then(data => {
  console.log('✅ Current Counter Status:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(e => console.error('❌ Error:', e));
```

---

## What Happens Next

**Before Cleanup:**
- Book 1: 2026-0001
- Book 2: 2026-0001 (DUPLICATE - will be deleted)
- Book 3: 2026-0002
- Book 3: 2026-0002 (DUPLICATE - will be deleted)
- ...continues...
- Counter value: 10
- Next book would be: 2026-0010

**After Cleanup:**
- Book 1: 2026-0001 ✅
- Book 2: 2026-0002 ✅
- Book 3: 2026-0003 ✅
- ...continues...
- Counter value: 50 (synced to highest)
- Next book will be: 2026-0051 ✅

---

## Safety Information

✅ **Safe operations:**
- Only deletes DUPLICATE books (keeps the first copy)
- Counter only updated, not reset
- No data loss - duplicates just removed
- Can run multiple times safely

⚠️ **Important:**
- If you add 100 books and 30 are duplicates, you'll have 70 books after cleanup
- This is correct - you should have 1 copy of each unique book
- Accession numbers will be: 2026-0001 through 2026-0070

---

## Troubleshooting

**No response from API?**
1. Check internet connection
2. Verify URL is correct
3. Check browser console for error message
4. Try again

**Counter still wrong after sync?**
1. Run sync again - it should pick up the latest
2. Check counter status with `/admin/counter-status`
3. Contact support if still wrong

**How many duplicates will be deleted?**
Run step 1 first, it will tell you how many were found and deleted

---

## After Cleanup

✅ Your books will have:
- No duplicate accession numbers
- Sequential accession numbers (0001, 0002, 0003...)
- Counter synced to the highest number
- New books continue from where the highest one was

✅ You can now:
- Add new books - they'll get correct sequential numbers
- Edit existing books with pictures
- Archive and manage books normally

---

**Date**: January 18, 2026
**Status**: ✅ Ready to use
**Recommended**: Run both steps together for complete cleanup
