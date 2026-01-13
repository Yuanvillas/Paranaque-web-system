# Parañaledge AI Assistant - Setup Guide

## Overview
Your library system now has an intelligent AI assistant that helps users find books, answer inquiries, and provides library recommendations. The AI can search through your book database and provide contextual responses.

## Features Implemented ✅

### Backend Enhancements (`backend/routes/aiRoutes.js`)
- **Smart Book Search**: AI automatically searches the database when users ask about books
- **Context-Aware Responses**: System generates intelligent responses based on actual books in your catalog
- **Multiple AI Providers**: Supports Google Gemini, OpenAI, and Mock mode
- **Database Integration**: Queries real book data (title, author, availability, genre, etc.)

### Frontend Enhancements (`src/pages/ChatPopup.js`)
- **Enhanced Chat UI**: Modern, responsive chat interface with animations
- **Auto-scrolling**: Messages automatically scroll into view
- **Quick Suggestions**: Pre-defined search suggestions for new users
- **Loading States**: Visual feedback while waiting for AI responses
- **Accessibility**: Better keyboard navigation and disabled state handling

### Styling (`src/components/App.css`)
- Beautiful gradient design matching your library theme
- Smooth animations and transitions
- Mobile-friendly responsive design
- Custom scrollbars and hover effects
- Visual feedback for all interactions

---

## Configuration

### Option 1: Using Google Gemini AI (Recommended)

1. **Get Google API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for your project
   - Copy the key

2. **Update `.env` file** in the `backend` folder:
```env
AI_PROVIDER=google
GOOGLE_API_KEY=your_api_key_here
AI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

3. **Install required packages** (if not already installed):
```bash
cd backend
npm install google-auth-library
```

### Option 2: Using OpenAI (GPT-3.5 or GPT-4)

1. **Get OpenAI API Key**:
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key

2. **Update `.env` file** in the `backend` folder:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

### Option 3: Mock Mode (Default - No API Key Required)

The system comes with a mock provider that works without any API key. This is perfect for:
- Development and testing
- Demonstrations
- When you're not ready to integrate a real AI provider

**Current setup**: `.env` defaults to `AI_PROVIDER=mock`

---

## How It Works

### User Interaction Flow

```
User asks: "Find me a science fiction book"
        ↓
Front-end sends message to /api/ai/chat
        ↓
Backend receives message
        ↓
System detects book-related keywords
        ↓
Database searches for books matching keywords
        ↓
AI generates system prompt with book context
        ↓
AI API called with enhanced prompt
        ↓
Response sent back to user with book suggestions
        ↓
Chat updates with AI reply and available books
```

### System Prompt
The AI receives a specialized system prompt that includes:
- Role as Parañaledge library assistant
- Current available books in the catalog
- Instructions to help users find books and answer library questions
- Guidance to be friendly and informative

---

## Example Queries Users Can Ask

✓ "Find me a book about history"
✓ "Do you have any science fiction novels?"
✓ "What books are available by Stephen King?"
✓ "Show me books about technology"
✓ "How do I borrow a book?"
✓ "What genres do you have?"
✓ "Recommend me a good book"
✓ "Is this book available?"

---

## Customization

### Modify System Prompt
Edit `backend/routes/aiRoutes.js` - function `buildSystemPrompt()`:
```javascript
function buildSystemPrompt(books) {
  let prompt = `Your custom introduction here...`;
  // Customize instructions, tone, personality
  return prompt;
}
```

### Adjust Book Search Behavior
Edit the `searchBooksInDB()` function in `aiRoutes.js`:
- Change search limit: `limit(5)` → `limit(10)`
- Add more search fields: Author, publisher, genre code
- Implement fuzzy matching for better results

### Customize UI
Edit `src/pages/ChatPopup.js`:
- Change quick suggestions array
- Modify colors and styling in `App.css`
- Add new features (file uploads, feedback system, etc.)

---

## Database Schema

The AI searches these Book fields:
- **title**: Book name
- **author**: Author name
- **publisher**: Publisher name
- **location.genreCode**: Genre/category
- **availableStock**: Number of copies available
- **year**: Publication year
- **archived**: Whether book is archived

---

## Troubleshooting

### Issue: "AI request failed"
- **Solution**: Check if `.env` file is correctly configured
- Verify API key is valid
- Check network connectivity

### Issue: "OPENAI_API_KEY not configured"
- **Solution**: Add `OPENAI_API_KEY` to `.env` file
- Restart the backend server: `npm run dev`

### Issue: Chat not showing book suggestions
- **Solution**: Ensure MongoDB is connected and books exist in database
- Check browser console for errors
- Verify `Book` model is properly imported

### Issue: Slow responses
- **Solution**: Check API rate limits (Google/OpenAI quotas)
- Reduce the number of books returned: change `limit(5)` to `limit(3)`
- Optimize database indexes on book fields

---

## Testing

### Test with Mock Provider (No API Key)
1. Keep `.env` with `AI_PROVIDER=mock`
2. Open chat popup
3. Try: "Find me a book about history"
4. Should return mock responses with matching books

### Test with Real API
1. Set `.env` with valid API key and provider
2. Restart backend: `npm run dev`
3. Test various queries
4. Monitor console for request/response logs

---

## Performance Tips

1. **Database Indexing**: Index commonly searched fields
```javascript
// Add to Book model
bookSchema.index({ title: 'text', author: 'text', publisher: 'text' });
```

2. **Caching**: Cache frequently accessed book lists
3. **Rate Limiting**: Implement rate limiting for API calls
4. **Error Handling**: Better error messages for debugging

---

## Next Steps

1. ✅ Configure your chosen AI provider
2. ✅ Test the chat with a few queries
3. ✅ Customize the system prompt for your library
4. ✅ Train users on how to interact with the AI
5. ✅ Monitor AI responses and refine as needed

---

## Support & Maintenance

- Monitor API usage and costs (especially with paid providers)
- Regularly update book database to keep AI suggestions current
- Collect user feedback to improve AI responses
- Review system logs for errors and optimization opportunities

---

**Enjoy your enhanced library AI system! 📚🤖**
