require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({ message: '✅ Backend is running!', status: 'ok' });
});

app.post('/api/ai/chat', (req, res) => {
  const { message } = req.body;
  res.json({ reply: `Echo: ${message}`, books: [] });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Test with: curl http://localhost:${PORT}/`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

