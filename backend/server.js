require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load routes
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const logRoutes = require('./routes/logRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const bookmarksRoutes = require('./routes/bookmarkRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5050;

// Middleware
const corsOptions = {
  origin: function(origin, callback) {
    // Allow any origin (for development/production flexibility)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Allow CORS and handle preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ROUTES - MUST BE BEFORE ERROR HANDLERS
// Root status route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: '✅ Parañaledge Library Backend - API Server',
    status: 'running',
    version: '1.1.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Backend is working!' });
});

// API routes
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use("/api/ai", aiRoutes);

// 404 Not Found - AFTER all routes
app.use((req, res) => {
  console.warn(`404 - Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: 'Endpoint not found',
    method: req.method,
    path: req.path
  });
});

// Global Error Handler - MUST BE LAST
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    status: 'error'
  });
});

// Start server
const { startReservationExpirationCheck } = require('./utils/reservationManager');

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🚀 Parañaledge Backend Running      ║
  ║   Port: ${PORT}                              ║
  ║   Env: ${(process.env.NODE_ENV || 'production').padEnd(31)}║
  ╚════════════════════════════════════════╝
  `);
  try {
    startReservationExpirationCheck();
    console.log('📅 Reservation expiration checker started');
  } catch (err) {
    console.error('⚠️  Reservation expiration checker error:', err.message);
  }
});
