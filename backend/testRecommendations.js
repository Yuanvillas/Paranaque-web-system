const axios = require('axios');

// Test the recommendations endpoint
async function testRecommendations() {
  try {
    // First, let's get all books to check if images exist
    console.log("=== Testing Books Endpoint ===");
    const booksRes = await axios.get('http://localhost:5050/api/books?limit=5');
    console.log("Sample books from database:");
    booksRes.data.books?.slice(0, 3).forEach(book => {
      console.log(`- ${book.title}`);
      console.log(`  Image: ${book.image}`);
      console.log(`  Author: ${book.author}`);
      console.log(`  Category: ${book.category}`);
    });

    // Now test the recommend endpoint
    console.log("\n=== Testing Recommendation Endpoint ===");
    
    // Create a sample borrowed books array
    const sampleBorrowedBooks = [
      {
        bookId: booksRes.data.books[0]?._id || '60d5ec49c1234567890abcd1',
        title: booksRes.data.books[0]?.title || 'Sample Book',
        author: booksRes.data.books[0]?.author || 'Sample Author',
        category: booksRes.data.books[0]?.category || 'Fiction'
      }
    ];

    console.log("Sending borrowed books:", sampleBorrowedBooks);

    const recRes = await axios.post('http://localhost:5050/api/ai/recommend', {
      borrowedBooks: sampleBorrowedBooks,
      limit: 3
    });

    console.log("\nRecommendations response:");
    console.log(`Total recommendations: ${recRes.data.recommendations?.length}`);
    recRes.data.recommendations?.forEach((book, idx) => {
      console.log(`\n${idx + 1}. ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Category: ${book.category}`);
      console.log(`   Image: ${book.image}`);
      console.log(`   Stock: ${book.stock}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testRecommendations();
