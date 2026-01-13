const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');
const Book = require('../models/Book');
const User = require('../models/User');

/**
 * POST /api/ai/chat
 * Body: { message: string, userId?: string }
 *
 * This route handles chat requests with enhanced book-finding capabilities.
 * Configuration (env):
 * - AI_PROVIDER: 'google' | 'openai' | 'mock' (default 'mock')
 * - AI_ENDPOINT: full REST URL to call (when using 'google')
 * - GOOGLE_API_KEY or OPENAI_API_KEY for API authentication
 */

// Helper function to search books in database
async function searchBooksInDB(query) {
  try {
    console.log(`[searchBooksInDB] Searching for: "${query}"`);
    
    // If no query or very short, return all available books
    if (!query || query.trim().length < 2) {
      console.log('[searchBooksInDB] Empty query, fetching all available books');
      const books = await Book.find({
        archived: false,
        availableStock: { $gt: 0 }
      }).limit(12).select('title author year availableStock publisher location genre').maxTimeMS(5000);
      console.log(`[searchBooksInDB] Found ${books.length} books`);
      return books;
    }

    const queryLower = query.toLowerCase();

    // If user asks for available books, show all available
    if (queryLower.includes('available') || queryLower.includes('what') || 
        queryLower.includes('show') || queryLower.includes('have') ||
        queryLower.includes('list')) {
      console.log('[searchBooksInDB] User asking for available books');
      const books = await Book.find({
        archived: false,
        availableStock: { $gt: 0 }
      }).limit(15).select('title author year availableStock publisher location genre').maxTimeMS(5000);
      return books;
    }

    // Multi-term search for flexible matching
    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    console.log(`[searchBooksInDB] Search terms: ${searchTerms.join(', ')}`);

    // Search by title, author, publisher, genre - use $regex operator
    const orConditions = [];
    searchTerms.forEach(term => {
      orConditions.push({ title: { $regex: term, $options: 'i' } });
      orConditions.push({ author: { $regex: term, $options: 'i' } });
      orConditions.push({ publisher: { $regex: term, $options: 'i' } });
      orConditions.push({ genre: { $regex: term, $options: 'i' } });
    });

    const books = await Book.find({
      archived: false,
      $or: orConditions
    }).limit(15).select('title author year availableStock publisher location genre').maxTimeMS(5000);

    console.log(`[searchBooksInDB] Initial search found ${books.length} books`);

    // If found results, prioritize available books
    if (books && books.length > 0) {
      return books.sort((a, b) => (b.availableStock || 0) - (a.availableStock || 0));
    }

    // If no results, try partial matching
    console.log('[searchBooksInDB] No results from initial search, trying partial match');
    const partialBooks = await Book.find({
      archived: false,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } }
      ]
    }).limit(10).select('title author year availableStock publisher location genre').maxTimeMS(5000);

    console.log(`[searchBooksInDB] Partial search found ${partialBooks ? partialBooks.length : 0} books`);
    return partialBooks || [];
  } catch (err) {
    console.error('[searchBooksInDB] Error:', err.message);
    return [];
  }
}

// Helper function to build system prompt with context
function buildSystemPrompt(books) {
  let prompt = `You are a helpful AI assistant for Parañaledge Library.

YOUR PRIMARY ROLES:
1. Help users find books in our library and answer library-related questions
2. Answer general questions on any topic (like a regular AI assistant)

LIBRARY BOOKS IN STOCK:
`;

  if (books && books.length > 0) {
    prompt += `We currently have ${books.length} books available:\n\n`;
    books.forEach((book, i) => {
      const stock = book.availableStock || 0;
      const status = stock > 0 ? `✓ Available (${stock})` : `✗ Unavailable`;
      const author = book.author || 'Unknown';
      const year = book.year ? ` (${book.year})` : '';
      prompt += `• "${book.title}" by ${author}${year} [${status}]\n`;
    });
  } else {
    prompt += `(No books found matching this search)\n`;
  }

  prompt += `
IMPORTANT GUIDELINES:
- When users ask about books: ONLY mention books from the list above if they match their request
- When users ask about books NOT in the list: Be honest and suggest alternatives from our inventory
- When users ask general questions (not about books): Feel free to answer normally
- Always be helpful, friendly, and accurate
`;
  return prompt;
}

router.post('/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  console.log(`[AI Chat] ✅ Received message: "${message}"`);
  console.log('[AI Chat] 🚀 Using Groq AI or Mock Mode only - NO Google API');
  
  try {
    // Always search for books relevant to the query
    console.log('[AI Chat] Searching books in database...');
    let contextBooks = [];
    // Search for relevant books
    contextBooks = await searchBooksInDB(message);
    console.log(`[AI Chat] Found ${contextBooks.length} context books`);

    const systemPrompt = buildSystemPrompt(contextBooks);

    // Try Google Gemini API first (free tier: 50 req/min)
    const googleApiKey = process.env.GOOGLE_API_KEY;
    
    if (googleApiKey && !googleApiKey.includes('your_')) {
      console.log('[AI Chat] 🚀 Attempting Google Gemini API...');
      console.log('[Google] API Key configured:', !!googleApiKey);
      console.log('[Google] Books in context:', contextBooks.length);
      try {
        // Add abort timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}\n\nUser question: ${message}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
            }
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);

        console.log('[Google] Response status:', googleRes.status);

        if (!googleRes.ok) {
          const errorData = await googleRes.json();
          console.error('[Google] ❌ API error:', errorData);
          throw new Error(`Google error: ${errorData?.error?.message || 'Unknown error'}`);
        }

        const googleData = await googleRes.json();
        console.log('[Google] Response received');
        const reply = googleData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Google Gemini';
        
        if (reply && reply.length > 0) {
          console.log('[Google] ✅ Successfully got response from Google Gemini');
          return res.json({ reply, provider: 'google', books: contextBooks });
        } else {
          throw new Error('Empty response from Google Gemini');
        }
      } catch (err) {
        console.error('[Google] ❌ Error:', err.message);
        console.warn('[Google] ⚠️  Google Gemini failed, falling back to mock mode with real library data');
      }
    } else {
      console.log('[AI Chat] 📚 Using Mock Mode (Google API not configured)');
    }

    // Try Groq AI (if enabled) - with timeout
    const groqApiKey = process.env.GROQ_API_KEY;
    const useGroq = process.env.USE_GROQ === 'true'; // Explicitly enable with env var
    
    if (useGroq && groqApiKey && !groqApiKey.includes('your_')) {
      console.log('[AI Chat] 🚀 Attempting Groq AI with 5 second timeout...');
      console.log('[Groq] API Key configured:', !!groqApiKey);
      console.log('[Groq] Books in context:', contextBooks.length);
      try {
        // Add abort timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-specdec',  // Use env var for model
            messages: [
              { 
                role: 'system', 
                content: systemPrompt  // This includes all the book context!
              },
              { 
                role: 'user', 
                content: message 
              }
            ],
            max_tokens: 600,
            temperature: 0.7
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);

        console.log('[Groq] Response status:', groqRes.status);

        if (!groqRes.ok) {
          const errorData = await groqRes.json();
          console.error('[Groq] ❌ API error:', errorData);
          throw new Error(`Groq error: ${errorData?.error?.message || 'Unknown error'}`);
        }

        const groqData = await groqRes.json();
        console.log('[Groq] Response received');
        const reply = groqData?.choices?.[0]?.message?.content || 'No response from Groq';
        
        if (reply && reply.length > 0) {
          console.log('[Groq] ✅ Successfully got response from Groq AI');
          return res.json({ reply, provider: 'groq', books: contextBooks });
        } else {
          throw new Error('Empty response from Groq');
        }
      } catch (err) {
        console.error('[Groq] ❌ Error:', err.message);
        console.warn('[Groq] ⚠️  Groq failed, falling back to mock mode with real library data');
      }
    }

    // DEFAULT: Mock provider with REAL book context from database
    // This is reliable, fast, and always works!
    console.log('[AI Chat] 📚 Using mock provider (searches your real library database)');
    let mockReply = '';
    
    if (contextBooks && contextBooks.length > 0) {
      console.log(`[AI Chat] Generating reply with ${contextBooks.length} books`);
      mockReply = `Welcome to Parañaledge Library.\n\n`;
      mockReply += `AVAILABLE BOOKS (${contextBooks.length} found)\n`;
      mockReply += `${'='.repeat(70)}\n\n`;
      
      contextBooks.forEach((book, index) => {
        const stock = book.availableStock || 0;
        const status = stock > 0 ? `Available (${stock})` : `Out of Stock`;
        const author = book.author || 'Unknown Author';
        const year = book.year ? ` (${book.year})` : '';
        const publisher = book.publisher ? `\n   Publisher: ${book.publisher}` : '';
        
        mockReply += `${index + 1}. TITLE: "${book.title}"\n`;
        mockReply += `   AUTHOR: ${author}${year}\n`;
        mockReply += `   STATUS: ${status}${publisher}\n\n`;
      });
      
      mockReply += `${'='.repeat(70)}\n`;
      mockReply += `Would you like more information about any of these books?`;
    } else {
      // If no books found, do a general search to show what's available
      const allBooks = await Book.find({ archived: false, availableStock: { $gt: 0 } }).limit(8).select('title author year availableStock');
      if (allBooks && allBooks.length > 0) {
        mockReply = `Your search did not match exactly, but here are available books in our library:\n\n`;
        mockReply += `AVAILABLE BOOKS (${allBooks.length} shown)\n`;
        mockReply += `${'='.repeat(70)}\n\n`;
        
        allBooks.forEach((book, index) => {
          const stock = book.availableStock || 0;
          const author = book.author || 'Unknown Author';
          const year = book.year ? ` (${book.year})` : '';
          
          mockReply += `${index + 1}. TITLE: "${book.title}"\n`;
          mockReply += `   AUTHOR: ${author}${year}\n`;
          mockReply += `   AVAILABILITY: ${stock} in stock\n\n`;
        });
        
        mockReply += `${'='.repeat(70)}\n`;
        mockReply += `Please try searching for a specific author, title, or genre.`;
      } else {
        mockReply = `I can assist you in finding books in our library. Please search for a specific title, author name, or genre.`;
      }
    }
    
    console.log('[AI Chat] Sending response with mock reply');
    return res.json({ reply: mockReply, books: contextBooks });
  } catch (err) {
    console.error('[AI Chat] Error:', err.message);
    console.error('[AI Chat] Stack:', err.stack);
    return res.status(500).json({ error: 'AI request failed', details: err.message });
  }
});

/**
 * POST /api/ai/recommend
 * Body: { borrowedBooks: array of book objects, limit: number (default 6) }
 * 
 * Uses AI to generate smart book recommendations based on user's borrowing history
 */
router.post('/recommend', async (req, res) => {
  try {
    const { borrowedBooks = [], limit = 6 } = req.body;

    if (!borrowedBooks || borrowedBooks.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Get all available books
    const allBooks = await Book.find({ archived: false });

    // Build context about user's preferences
    const userBookTitles = borrowedBooks.map(b => b.bookId?.title || b.title).filter(Boolean).join(', ');
    const userCategories = new Set();
    borrowedBooks.forEach(b => {
      if (b.bookId?.category) userCategories.add(b.bookId.category);
      if (b.category) userCategories.add(b.category);
    });

    const borrowedIds = new Set(borrowedBooks.map(b => (b.bookId?._id || b.bookId)?.toString()));

    // Filter out books user has already borrowed
    const availableBooks = allBooks.filter(b => !borrowedIds.has(b._id?.toString()));

    // Use AI-like logic to recommend based on categories and author patterns
    const prompt = `Based on a user who has borrowed these books: "${userBookTitles}", 
    please recommend ${limit} books from this list that would interest them.
    
    Available books to recommend from:
    ${availableBooks.slice(0, 30).map(b => `- "${b.title}" by ${b.author} (${b.category})`).join('\n')}
    
    Consider:
    1. Similar categories they've shown interest in
    2. Popular authors in genres they like
    3. Variety to expand their reading
    
    Return ONLY a JSON array with the book titles they should read, in order of recommendation.`;

    // For now, use smart filtering instead of actual AI
    // Get books in same categories
    const categoryMatches = availableBooks.filter(b => 
      Array.from(userCategories).includes(b.category)
    );

    // Get books from similar authors
    const userAuthors = new Set();
    borrowedBooks.forEach(b => {
      if (b.bookId?.author) userAuthors.add(b.bookId.author);
      if (b.author) userAuthors.add(b.author);
    });

    const authorMatches = availableBooks.filter(b => 
      userAuthors.has(b.author)
    );

    // Combine and deduplicate - PRIORITIZE BOOKS WITH IMAGES
    const recommendedIds = new Set();
    const recommendations = [];

    // Combine all candidate books
    const allCandidates = [
      ...categoryMatches.map(b => ({ ...b.toObject(), priority: 3 })), // Highest priority
      ...authorMatches.map(b => ({ ...b.toObject(), priority: 2 })),   // Medium priority
      ...availableBooks.map(b => ({ ...b.toObject(), priority: 1 }))   // Lowest priority
    ];

    // Remove duplicates (keep highest priority version)
    const uniqueCandidates = [];
    const seenIds = new Set();
    allCandidates.forEach(book => {
      const bookId = book._id.toString();
      if (!seenIds.has(bookId)) {
        uniqueCandidates.push(book);
        seenIds.add(bookId);
      }
    });

    // Sort by: 1) has image (true first), 2) priority (high first)
    uniqueCandidates.sort((a, b) => {
      const aHasImage = !!a.image ? 1 : 0;
      const bHasImage = !!b.image ? 1 : 0;
      if (bHasImage !== aHasImage) return bHasImage - aHasImage;
      return (b.priority || 0) - (a.priority || 0);
    });

    // Take top limit items
    for (let i = 0; i < uniqueCandidates.length && recommendations.length < limit; i++) {
      const book = uniqueCandidates[i];
      if (!recommendedIds.has(book._id.toString())) {
        recommendations.push(book);
        recommendedIds.add(book._id.toString());
      }
    }

    // Log the recommendations for debugging
    console.log('Recommendations returned:', recommendations.map(r => ({ 
      title: r.title, 
      hasImage: !!r.image,
      image: r.image ? r.image.substring(0, 50) + '...' : 'NO IMAGE',
      category: r.category,
      author: r.author
    })));

    res.json({ 
      recommendations: recommendations.slice(0, limit),
      reasoning: `Found ${recommendations.length} recommendations based on categories: ${Array.from(userCategories).join(', ')} and authors you enjoy.`
    });
  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ error: 'Recommendation failed', details: err.message });
  }
});

module.exports = router;
