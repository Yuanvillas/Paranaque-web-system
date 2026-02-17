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
        const status = stock > 0 ? `Available (${stock})` : `Not Available`;
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
 * Uses intelligent content analysis for smart book recommendations based on:
 * - DDC classification matching (call numbers)
 * - Subject/keyword similarity
 * - Genre and category alignment
 * - Author and publisher patterns
 * - Recency and popularity
 */
router.post('/recommend', async (req, res) => {
  try {
    const { borrowedBooks = [], limit = 6 } = req.body;

    if (!borrowedBooks || borrowedBooks.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Get all available books
    const allBooks = await Book.find({ archived: false });
    const borrowedIds = new Set(borrowedBooks.map(b => (b.bookId?._id || b.bookId)?.toString()));
    const availableBooks = allBooks.filter(b => !borrowedIds.has(b._id?.toString()));

    // Extract user preference patterns
    const userProfile = extractUserProfile(borrowedBooks);

    // Score all available books based on multiple factors
    const scoredBooks = availableBooks.map(book => {
      const score = calculateRecommendationScore(book, userProfile, borrowedBooks);
      return { book: book.toObject(), score };
    });

    // Sort by score (highest first) then by image availability
    scoredBooks.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aHasImage = a.book.image ? 1 : 0;
      const bHasImage = b.book.image ? 1 : 0;
      return bHasImage - aHasImage;
    });

    // Take top recommendations
    const recommendations = scoredBooks.slice(0, limit).map(s => s.book);

    console.log('❯ Enhanced Recommendations:', recommendations.map(r => ({
      title: r.title,
      score: (scoredBooks.find(s => s.book._id.toString() === r._id.toString())?.score || 0).toFixed(2),
      author: r.author,
      subject: r.subject,
      ddc: r.callNumber
    })));

    res.json({
      recommendations,
      reasoning: `Personalized based on ${userProfile.genres.size} genres, ${userProfile.subjects.size} subjects, and ${userProfile.authors.size} authors you enjoy.`
    });
  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ error: 'Recommendation failed', details: err.message });
  }
});

/**
 * Extract user preference profile from their borrowing history
 */
function extractUserProfile(borrowedBooks) {
  const profile = {
    genres: new Set(),
    categories: new Set(),
    subjects: new Set(),
    authors: new Set(),
    publishers: new Set(),
    ddcClassifications: new Set(),
    keywords: new Map(),
    avgYear: 0,
    totalBooks: borrowedBooks.length
  };

  const years = [];

  borrowedBooks.forEach(b => {
    const book = b.bookId || b;
    
    if (book.genre) profile.genres.add(book.genre.toLowerCase());
    if (book.category) profile.categories.add(book.category.toLowerCase());
    if (book.subject) {
      // Extract keywords from subject
      const keywords = book.subject.toLowerCase().split(/[,;\/]/).map(k => k.trim());
      keywords.forEach(kw => {
        if (kw) profile.keywords.set(kw, (profile.keywords.get(kw) || 0) + 1);
        profile.subjects.add(kw);
      });
    }
    if (book.author) profile.authors.add(book.author.toLowerCase());
    if (book.publisher) profile.publishers.add(book.publisher.toLowerCase());
    
    // Extract DDC classification from call number (first 3 digits usually)
    if (book.callNumber) {
      const ddc = book.callNumber.substring(0, 3);
      profile.ddcClassifications.add(ddc);
    }
    
    if (book.year) years.push(book.year);
  });

  profile.avgYear = years.length > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : 2020;

  return profile;
}

/**
 * Calculate relevance score for a book based on user profile
 * Higher score = better recommendation
 */
function calculateRecommendationScore(book, userProfile, borrowedBooks) {
  let score = 0;

  const bookGenre = (book.genre || '').toLowerCase();
  const bookCategory = (book.category || '').toLowerCase();
  const bookSubject = (book.subject || '').toLowerCase();
  const bookAuthor = (book.author || '').toLowerCase();
  const bookPublisher = (book.publisher || '').toLowerCase();
  const bookDdc = book.callNumber ? book.callNumber.substring(0, 3) : '';

  // 1. SUBJECT/KEYWORD MATCHING (Weight: 35%)
  if (book.subject) {
    const subjectKeywords = book.subject.toLowerCase().split(/[,;\/]/).map(k => k.trim());
    let matchingKeywords = 0;
    subjectKeywords.forEach(kw => {
      if (userProfile.keywords.has(kw)) {
        matchingKeywords += userProfile.keywords.get(kw);
      }
    });
    score += Math.min(matchingKeywords * 8, 35);
  }

  // 2. DDC CLASSIFICATION MATCHING (Weight: 25%)
  if (bookDdc && userProfile.ddcClassifications.has(bookDdc)) {
    score += 25;
  } else if (bookDdc) {
    // Partial credit for similar DDC class (first digit match)
    const bookDdcClass = bookDdc.charAt(0);
    const hasSimilarDdc = Array.from(userProfile.ddcClassifications).some(ddc => ddc.charAt(0) === bookDdcClass);
    if (hasSimilarDdc) score += 12;
  }

  // 3. GENRE/CATEGORY MATCHING (Weight: 20%)
  if (userProfile.genres.has(bookGenre) || userProfile.categories.has(bookCategory)) {
    score += 20;
  } else if (userProfile.genres.size > 0 || userProfile.categories.size > 0) {
    // Partial credit if no exact match but user has preferences
    score += 5;
  }

  // 4. AUTHOR & PUBLISHER PATTERNS (Weight: 12%)
  if (userProfile.authors.has(bookAuthor)) {
    score += 12;
  } else if (userProfile.publishers.has(bookPublisher)) {
    score += 8;
  }

  // 5. RECENCY & POPULARITY (Weight: 8%)
  const yearDifference = Math.abs(book.year - userProfile.avgYear);
  if (yearDifference <= 5) {
    score += 8; // Recent books similar to user's preference era
  } else if (yearDifference <= 15) {
    score += 4;
  }

  // BONUS: Has image for better display (+3)
  if (book.image) {
    score += 3;
  }

  // BONUS: Diversity boost - if not from exact same category as most borrowed
  const mostCommonCategory = getMostCommonValue(userProfile.categories);
  if (mostCommonCategory && bookCategory !== mostCommonCategory) {
    score += 2; // Encourage reading different genres
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Helper: Get the most common value from a Set (by frequency)
 */
function getMostCommonValue(valueSet) {
  if (valueSet.size === 0) return null;
  return Array.from(valueSet)[0];
}

module.exports = router;
