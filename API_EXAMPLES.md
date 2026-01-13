# AI Chat Examples & API Documentation

## 📌 REST API Endpoint

### POST `/api/ai/chat`

**Request:**
```json
{
  "message": "Find me a science fiction book"
}
```

**Response (Mock Mode):**
```json
{
  "reply": "I'm Parañaledge AI! I found some books for you:\n\n📚 \"Foundation\" by Isaac Asimov (1951) - ✓ Available\n📚 \"Dune\" by Frank Herbert (1965) - ✓ Available\n📚 \"Neuromancer\" by William Gibson (1984) - ✗ Reserved\n\nWould you like more details about any of these books or would you like to search for something else?",
  "books": [
    {
      "_id": "...",
      "title": "Foundation",
      "author": "Isaac Asimov",
      "year": 1951,
      "availableStock": 3,
      "publisher": "Doubleday"
    },
    {
      "_id": "...",
      "title": "Dune",
      "author": "Frank Herbert",
      "year": 1965,
      "availableStock": 1,
      "publisher": "Chilton"
    },
    {
      "_id": "...",
      "title": "Neuromancer",
      "author": "William Gibson",
      "year": 1984,
      "availableStock": 0,
      "publisher": "Ace Books"
    }
  ]
}
```

---

## 💬 Example Conversations

### Example 1: Book Search

**User:** "Find me a mystery novel"

**AI Response (Mock):**
```
I'm Parañaledge AI! I found some books for you:

📚 "The Girl with the Dragon Tattoo" by Stieg Larsson (2005) - ✓ Available
📚 "Gone Girl" by Gillian Flynn (2012) - ✓ Available
📚 "The Midnight Library" by Matt Haig (2020) - ✗ Reserved

💡 Tip: You can ask for more details about any book or search for something else!
```

---

### Example 2: Author Search

**User:** "Do you have books by Stephen King?"

**AI Response (Google Gemini):**
```
Yes! We have several Stephen King books in our library:

📚 "The Shining" (1977) - ✓ Available - 2 copies
📚 "It" (1986) - ✓ Available - 1 copy
📚 "The Stand" (1978) - ✗ Currently Reserved

All of these are great choices! "The Shining" is perfect if you enjoy psychological horror, while "It" is an epic story about friendship and overcoming fears. Would you like information about any of these?
```

---

### Example 3: Recommendations

**User:** "Can you recommend a good book?"

**AI Response (OpenAI GPT-3.5):**
```
I'd love to recommend some great books! Here are popular titles we have available:

📚 "The Book Thief" by Markus Zusak - A beautifully written story about a girl in Nazi Germany
📚 "Educated" by Tara Westover - An inspiring memoir about self-education
📚 "Project Hail Mary" by Andy Weir - An exciting sci-fi adventure

What kind of books do you usually enjoy? That would help me give you a more personalized recommendation!
```

---

### Example 4: Availability Check

**User:** "Is 'The Great Gatsby' available?"

**AI Response:**
```
Let me check our catalog... 

📚 "The Great Gatsby" by F. Scott Fitzgerald (1925)
Status: ✓ Available
Available Copies: 2
Publisher: Scribner
Location: Fiction - Shelf 3, Level 2

We have copies available! You can borrow this classic novel anytime. Would you like to know how to place a hold or borrow it?
```

---

### Example 5: Genre Query

**User:** "What historical fiction do you have?"

**AI Response:**
```
Great taste! Here are historical fiction books we currently have:

📚 "All the Light We Cannot See" by Anthony Doerr (2014) - ✓ Available
📚 "The Pillars of the Earth" by Ken Follett (1989) - ✓ Available
📚 "Wolf Hall" by Hilary Mantel (2009) - ✓ Available
📚 "The Name of the Rose" by Umberto Eco (1980) - ✗ Reserved

These are all excellent reads! Which period of history interests you most? I can provide more specific recommendations if you'd like.
```

---

### Example 6: Multiple Questions

**User:** "How do I borrow a book?"

**AI Response:**
```
Great question! Here's how borrowing works at Parañaledge Library:

📋 Borrowing Process:
1. Find a book you like (you can ask me to help!)
2. Check availability (I can tell you which books are available)
3. Visit the library desk or use our app
4. Click "Borrow" - we'll process it for you
5. You'll have the book for 14 days
6. Return it by the due date or renew online

💡 Tips:
- You can reserve books that are currently checked out
- You get email reminders before your books are due
- You can have up to 5 books at once

Need help finding a specific book?
```

---

## 🔍 Search Capabilities

The AI can search and find books by:

### Title Search
- "Find Harry Potter books"
- "Do you have 1984?"
- "Show me books with 'time' in the title"

### Author Search
- "Books by Stephen King"
- "What works by Agatha Christie?"
- "Do you have anything by Margaret Atwood?"

### Genre Search
- "Show me romance novels"
- "Fantasy books please"
- "What mysteries do you have?"

### Availability Search
- "What books are available right now?"
- "Which science fiction books are in stock?"
- "Show me available history books"

### Combined Search
- "Available books about space exploration"
- "Recent releases by Neil Gaiman"
- "Mystery novels published after 2020"

---

## ⚙️ System Architecture

```
User Interface (React)
    ↓
ChatPopup Component
    ↓
/api/ai/chat Endpoint
    ↓
Backend (Node.js/Express)
    ├→ searchBooksInDB() → MongoDB Query
    ├→ buildSystemPrompt() → Create AI Context
    ├→ AI Provider Selection
    │   ├→ Mock: Instant Response
    │   ├→ Google Gemini: API Call
    │   └→ OpenAI: API Call
    ↓
Response with Books Array
    ↓
ChatPopup displays results
```

---

## 📊 Response Types

### 1. Successful Search
```json
{
  "reply": "I found these books for you...",
  "books": [
    { "title": "...", "author": "...", "availableStock": 2 }
  ]
}
```

### 2. No Books Found
```json
{
  "reply": "I couldn't find books matching your search. Try searching by...",
  "books": []
}
```

### 3. Error Response
```json
{
  "reply": "❌ Error contacting AI. Please try again.",
  "error": "API_KEY_INVALID"
}
```

---

## 🎯 Configuration Examples

### Mock Mode (Default)
```env
AI_PROVIDER=mock
# No API key needed, instant responses
```

### Google Gemini
```env
AI_PROVIDER=google
GOOGLE_API_KEY=AIzaSyD...
AI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

### OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
```

---

## 🚀 Quick Test

### Using cURL
```bash
curl -X POST http://localhost:5050/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me a science fiction book"}'
```

### Using JavaScript
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "Find me a book" })
});
const data = await response.json();
console.log(data.reply);
```

### Using Python
```python
import requests

response = requests.post(
  'http://localhost:5050/api/ai/chat',
  json={'message': 'Find me a book about history'}
)
print(response.json()['reply'])
```

---

## 📈 Performance Metrics

| Metric | Mock | Google | OpenAI |
|--------|------|--------|--------|
| Response Time | <100ms | 500-2000ms | 1-5s |
| Cost | Free | Free (generous) | Paid |
| Setup Time | 0min | 5min | 5min |
| Accuracy | Good | Excellent | Excellent |

---

## 🐛 Common API Responses

### Missing Message
```json
{ "error": "Missing message" }
```

### API Key Error
```json
{ "error": "OPENAI_API_KEY not configured" }
```

### Database Error
```json
{ 
  "error": "AI request failed",
  "details": "MongoDB connection error"
}
```

---

## 💡 Integration Tips

1. **Handle Loading States**
   ```javascript
   setIsLoading(true);
   // make API call
   setIsLoading(false);
   ```

2. **Parse Responses Safely**
   ```javascript
   const reply = data?.reply || 'Error getting response';
   const books = data?.books || [];
   ```

3. **Retry Failed Requests**
   ```javascript
   const maxRetries = 3;
   let retries = 0;
   while (retries < maxRetries) {
     try {
       // make request
       break;
     } catch (err) {
       retries++;
     }
   }
   ```

---

## 📞 Support

For detailed API documentation: See `AI_SETUP_GUIDE.md`
For quick setup: See `QUICKSTART.md`
For examples: See this file

---

*Happy integrating!* 🚀📚
