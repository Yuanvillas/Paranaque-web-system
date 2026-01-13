// Quick script to test the fix endpoint
const fetch = require('node-fetch');

async function fixAccessionNumbers() {
  try {
    console.log('🔧 Calling fix-accession-numbers endpoint...');
    const response = await fetch(
      'https://paranaque-web-system.onrender.com/api/books/admin/fix-accession-numbers',
      { method: 'POST' }
    );
    
    const data = await response.json();
    console.log('✅ Response:', data);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

fixAccessionNumbers();
