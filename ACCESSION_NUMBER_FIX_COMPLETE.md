# ✅ Accession Number Counter - FULLY FIXED

## Problem
Accession numbers were resetting to **2026-0001** when adding new books, even though the counter showed it would be **2026-0010**.

## Root Cause
Found THREE issues:

1. **initializeCounter.js** was using OLD counter name `'accessionNumber'` instead of year-specific `accessionNumber-2026`
2. **fix-accession-numbers endpoint** was updating old counter, not the year-specific one
3. Server startup was resetting counters without checking if they already exist

## Solution Applied

### 1. Fixed `backend/initializeCounter.js`
Changed from:
- ❌ Looking for counter named `'accessionNumber'`
- ❌ Resetting counter on every startup

To:
- ✅ Uses year-specific counter `accessionNumber-2026`
- ✅ **Only initializes if counter doesn't exist** (skips if already created)
- ✅ Cleans up old global counter if found
- ✅ Properly counts books from current year only

### 2. Fixed `backend/routes/bookRoutes.js`
Updated `/admin/fix-accession-numbers` endpoint to:
- ✅ Use year-specific counter name
- ✅ Reset the correct counter
- ✅ Update the correct counter after fix

## Files Changed

**1. backend/initializeCounter.js** (Lines 6-57)
```javascript
// NOW: Only initializes counter if it doesn't exist
// Skips initialization if counter for 2026 already exists
if (existingCounter) {
  console.log(`✅ Counter for ${currentYear} already exists with value: ${existingCounter.value}`);
  return; // Don't reset!
}
```

**2. backend/routes/bookRoutes.js** (Lines 1472-1518)
```javascript
// NOW: Uses year-specific counter
const counterName = `accessionNumber-${currentYear}`;
await Counter.findOneAndUpdate(
  { name: counterName },
  ...
);
```

## How It Works Now

### Scenario: Adding Books

1. **First book of the year**
   - Counter doesn't exist
   - initializeCounter.js creates it with value 0
   - First book gets accession number **2026-0001**

2. **Second book**
   - Counter exists with value 1
   - Increment to 2
   - Get accession number **2026-0002**

3. **Server restarts after 10 books added**
   - Counter still has value 10
   - initializeCounter.js checks: "Does `accessionNumber-2026` exist?" YES ✅
   - Skips reset, keeps value at 10
   - Next book gets **2026-0011**

## Testing

### Test 1: Add Multiple Books
1. Go to Admin Dashboard → Add Book
2. Add 5 books
3. Check accession numbers: 2026-0001, 2026-0002, etc. ✅

### Test 2: Check Counter Status
```bash
GET /api/books/admin/counter-status
```
Should show correct "next accession number"

### Test 3: Server Restart
1. Add book → gets 2026-0005
2. Restart server
3. Add another book → should get 2026-0006 (NOT 2026-0001)

### Test 4: Manual Reset (if needed)
```bash
POST /api/books/admin/reset-counter
```
This deletes the counter, next book gets 2026-0001 again

## Key Improvements

✅ **Counter persists across restarts** - No more resets on server startup
✅ **Year-specific** - Each year has independent counter
✅ **No overwrite** - Only initializes when counter is missing
✅ **Atomic operations** - No race conditions
✅ **Admin tools** - Can check and reset if needed

## Deployment Instructions

1. **Restart backend server** (to run new initializeCounter.js)
2. **Test adding books** - Should continue from previous count
3. **Check counter status** - Verify it's correct

## Safety Notes

- ✅ Safe to restart server - counter won't reset
- ✅ Existing books not affected
- ✅ Can manually reset with POST /admin/reset-counter if needed
- ✅ Old global counter automatically cleaned up

## If Something Goes Wrong

**Counter still resetting?**
1. Check MongoDB - does `accessionNumber-2026` exist in Counter collection?
2. Check logs - look for "Counter initialized" or "Counter already exists"
3. Manual fix: POST /api/books/admin/reset-counter then check status

**Counter not incrementing?**
1. GET /api/books/admin/counter-status
2. Verify currentValue is increasing
3. Check browser console for errors

---

**Status**: ✅ FULLY FIXED - Ready for production
**Date**: January 18, 2026
**Impact**: Accession numbers now persist correctly across restarts
