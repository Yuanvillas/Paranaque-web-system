#!/usr/bin/env node

/**
 * Test script to verify DDC call number generation
 * Run this in the backend directory: node testCallNumberGeneration.js
 */

const { generateCallNumber, getDDCCode, getAuthorInitials } = require('./utils/ddc');

console.log('📚 Testing DDC Call Number Generation');
console.log('=====================================\n');

// Test 1: Check DDC codes for different categories
console.log('Test 1: DDC Code Generation');
console.log('---------------------------');
const testCategories = ['Science', 'Math', 'English', 'Fiction', 'History'];
testCategories.forEach(cat => {
  const code = getDDCCode(cat);
  console.log(`  ${cat.padEnd(15)} → ${code}`);
});

// Test 2: Check author initials
console.log('\nTest 2: Author Initial Extraction');
console.log('----------------------------------');
const testAuthors = [
  'J.K. Rowling',
  'Stephen King',
  'George Orwell',
  'Jane Austen',
  'Single Name'
];
testAuthors.forEach(author => {
  const initials = getAuthorInitials(author);
  console.log(`  ${author.padEnd(20)} → ${initials}`);
});

// Test 3: Generate complete call numbers
console.log('\nTest 3: Complete Call Number Generation');
console.log('---------------------------------------');
const testBooks = [
  { category: 'Science', author: 'Albert Einstein', seq: 1 },
  { category: 'English', author: 'William Shakespeare', seq: 2 },
  { category: 'Fiction', author: 'J.K. Rowling', seq: 1 },
  { category: 'Math', author: 'Isaac Newton', seq: 1 },
  { category: 'Unknown', author: 'Anonymous Writer', seq: 5 }
];

testBooks.forEach(book => {
  const callNum = generateCallNumber(book.category, book.author, book.seq);
  console.log(`  ${book.category.padEnd(12)} | ${book.author.padEnd(20)} | Seq: ${book.seq} → ${callNum}`);
});

console.log('\n✅ All tests completed!');
console.log('\nExpected DDC Formats:');
console.log('  - Science books: 500-XX-XXXX');
console.log('  - Math books: 510-XX-XXXX');
console.log('  - English books: 820-XX-XXXX');
console.log('  - Fiction books: 800-XX-XXXX');
console.log('\nWhere:');
console.log('  DDD = Dewey Decimal Code');
console.log('  XX = Author Initials');
console.log('  XXXX = Sequence Number (padded to 4 digits)');
