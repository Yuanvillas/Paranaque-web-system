# 🧪 AI Real Inventory - Testing Guide

## Quick Start Testing

### Prerequisites
- Backend server running: `http://localhost:5050`
- Frontend running: `http://localhost:3000`
- Logged in to the app
- AI chat popup visible (bottom right)

---

## Test Scenarios

### Test 1: Ask for Available Books
**Query:** `What books are available?`

**Expected Response:**
```
Found X book(s) in our library:

📚 "Exact Book Title"
   Author: Author Name (Year)
   Status: ✓ Available (5 copy/copies)

📚 "Another Real Book Title"
   Author: Another Author (2020)
   Status: ✓ Available (2 copy/copies)

Would you like more details about any of these books?
```

**NOT Expected (bad):**
- "The Midnight Library by Matt Haig"
- "Project Hail Mary by Andy Weir"
- "I don't have real-time inventory"

---

### Test 2: Search for Specific Book
**Query:** `Do you have [book title that exists in your library]?`

**Example:** `Do you have the great gatsby?`

**Expected Response:**
```
Found 1 book(s) in our library:

📚 "The Great Gatsby"
   Author: F. Scott Fitzgerald (1925)
   Status: ✓ Available (3 copy/copies)

Would you like more details about any of these books?
```

---

### Test 3: Search by Author
**Query:** `What books by [author name] do you have?`

**Example:** `What books by Jane Austen do you have?`

**Expected Response:**
```
Found 2 book(s) in our library:

📚 "Pride and Prejudice"
   Author: Jane Austen (1813)
   Status: ✓ Available (2 copy/copies)

📚 "Emma"
   Author: Jane Austen (1815)
   Status: ✓ Available (1 copy/copies)

Would you like more details about any of these books?
```

---

### Test 4: Search by Genre
**Query:** `Show me some [genre] books`

**Example:** `Show me some science fiction books`

**Expected Response:**
```
Found 3 book(s) in our library:

📚 "Dune"
   Author: Frank Herbert (1965)
   Status: ✓ Available (1 copy/copies)

📚 "[Your Sci-Fi Book 1]"
   Author: [Author] (Year)
   Status: ✓ Available (X copy/copies)

📚 "[Your Sci-Fi Book 2]"
   Author: [Author] (Year)
   Status: ✗ Out of Stock

Would you like more details about any of these books?
```

**Important:** Only shows books actually in YOUR database

---

### Test 5: No Match Found
**Query:** `Do you have [book title NOT in your library]?`

**Example:** `Do you have the Lord of the Rings?`

**Expected Response:**
```
I didn't find books matching that exactly, but here are some books we have available:

📚 "Book 1" by Author (Year) - X available
📚 "Book 2" by Author (Year) - Y available
...

Try searching for a specific author, title, or genre!
```

**NOT Expected (bad):**
- Suggesting "The Lord of the Rings" if it's not in your database

---

### Test 6: Empty Library (No Books Added)
**Query:** `What books do you have?`

**If no books in database:**
```
I can help you find books in our library. What are you looking for? (e.g., book title, author name, or genre)
```

**Action Required:** Add books to your MongoDB database

---

## Checking What's in Your Database

### Option 1: Using MongoDB Atlas (Web Interface)
1. Go to https://cloud.mongodb.com
2. Log in with your credentials
3. Navigate to your cluster
4. Find the "libraryDB" database
5. View the "books" collection
6. You should see your books with fields: title, author, availableStock, etc.

### Option 2: Using Terminal
```bash
# From backend directory
cd backend
node -e "
const mongoose = require('mongoose');
const Book = require('./models/Book');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const books = await Book.find({archived: false}).limit(10);
  console.log('Books in database:', books.length);
  books.forEach((b, i) => console.log((i+1) + '. ' + b.title + ' - Stock: ' + b.availableStock));
  process.exit();
});
"
```

---

## Debugging Output

### Check Backend Console
When you ask the AI something, look at the terminal running the backend. You should see:

```
[Google AI] Sending combined prompt with system instructions + user message
[Google AI] Books in context: 5
[Google AI] Response status: 200
```

This confirms:
- ✅ System prompt is being sent
- ✅ Books from database are in the prompt
- ✅ Google API responded successfully

### If You See Errors:
```
[Google AI] Response status: 401
```
- ❌ API key is invalid

```
Books in context: 0
```
- ❌ No books found in database matching the search

---

## Step-by-Step Testing Checklist

- [ ] Backend server running (`http://localhost:5050`)
- [ ] Frontend running (`http://localhost:3000`)
- [ ] Logged in to app
- [ ] Chat popup visible in bottom right
- [ ] Type: "What books are available?"
- [ ] AI responds with REAL books from your library
- [ ] AI does NOT mention "The Midnight Library"
- [ ] AI does NOT mention "Project Hail Mary"
- [ ] AI does NOT mention "Dune" (unless actually in your library)
- [ ] AI shows availability numbers (✓ Available (3))
- [ ] Search works for author names
- [ ] Search works for book titles
- [ ] "No match" fallback shows other available books

---

## Expected Behavior Summary

| User Says | AI Should | AI Should NOT |
|-----------|-----------|---------------|
| "What's available?" | List ALL real books in stock | Suggest generic popular books |
| "Do you have [book]?" | Show if it exists in library | Recommend alternatives |
| "Show me fiction" | List fiction books in library | Suggest books not in database |
| "Books by [author]?" | Show author's books in library | Claim author not available |
| "[Book NOT in DB]?" | Show available alternatives | Pretend to have that book |

---

## Real vs Fake Responses

### ✅ REAL Response (After Fix)
```
Found 5 book(s) in our library:

📚 "The Hobbit"
   Author: J.R.R. Tolkien (1937)
   Status: ✓ Available (2 copy/copies)

📚 "Python Programming"
   Author: Mark Lutz (2009)
   Status: ✓ Available (1 copy/copies)

Would you like more details about any of these books?
```

### ❌ FAKE Response (Before Fix)
```
As an AI, I don't have access to real-time inventory from a specific library. 
However, I can provide you with a sample list of popular and well-regarded books:

1. **"The Midnight Library"** by Matt Haig...
2. **"Project Hail Mary"** by Andy Weir...
3. **"Where the Crawdads Sing"** by Delia Owens...
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Still seeing generic books | Restart backend: `node server.js` |
| AI says "no books found" | Check if books exist in MongoDB |
| Chat not working | Ensure you're logged in |
| Backend not starting | Check MongoDB connection |
| API errors in console | Verify GOOGLE_API_KEY in .env |

---

## Questions to Ask AI

Try these to thoroughly test:

1. **"What books are available?"** - Tests: General availability query
2. **"Do you have the Great Gatsby?"** - Tests: Specific title search
3. **"Show me some fiction books"** - Tests: Genre search
4. **"What books by [author] do you have?"** - Tests: Author search
5. **"I'm looking for a good thriller"** - Tests: Genre recommendation (only from library)
6. **"What's popular right now?"** - Tests: Trending (should show library's books only)

---

## Expected Result

After these fixes, the AI should:

1. ✅ Show REAL books from your database
2. ✅ Display accurate availability numbers
3. ✅ Never suggest books not in your library
4. ✅ Provide honest "no match" responses
5. ✅ Include author and year information
6. ✅ Show publisher/location when available

**The AI is now your library's personal assistant, not a generic book recommendation engine.**
