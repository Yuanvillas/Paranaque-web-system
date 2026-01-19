require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Force redeploy - build path fix v2

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

// Serve React build folder as static files
const fs = require('fs');

// React's npm run build outputs to /build at project root
let buildPath = path.join(__dirname, '../build');

// Fallback: check for /src/build if root doesn't exist
if (!fs.existsSync(buildPath)) {
  const altPath = path.join(__dirname, '../src/build');
  if (fs.existsSync(altPath)) {
    buildPath = altPath;
  }
}

console.log(`\n📁 ========== BUILD PATH ==========`);
console.log(`📁 Backend directory (__dirname): ${__dirname}`);
console.log(`📁 Using buildPath: ${buildPath}`);

if (fs.existsSync(buildPath)) {
  console.log(`✅ Build folder found`);
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log(`✅ index.html exists`);
  } else {
    console.error(`❌ index.html NOT found in build folder`);
  }
} else {
  console.error(`❌ Build folder NOT found at ${buildPath}`);
  console.error(`This means 'npm run build' hasn't been run or failed`);
}

console.log(`📁 ================================\n`);

app.use(express.static(buildPath));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ROUTES - MUST BE BEFORE ERROR HANDLERS
// Root status route - MUST serve the React app for SPA
app.get('/', (req, res) => {
  // For API clients checking backend health
  const userAgent = req.get('user-agent') || '';
  if (userAgent.includes('curl') || userAgent.includes('Postman') || req.accepts('json')) {
    return res.status(200).json({ 
      message: '✅ Parañaledge Library Backend - API Server',
      status: 'running',
      version: '1.1.0',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString()
    });
  }
  // For browser requests, serve the React app
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      console.warn(`⚠️  Could not serve index.html from ${buildPath}: ${err.message}`);
      res.status(404).json({ 
        message: 'Page not found',
        buildPath: buildPath,
        error: err.message
      });
    }
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

// Serve React app for client-side routes (BEFORE 404 handler)
app.get('*', (req, res) => {
  // Check if it's an API route (should have been caught above)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ 
      message: 'API Endpoint not found',
      method: req.method,
      path: req.path
    });
  }
  // Serve index.html for all other routes (React Router will handle them)
  res.sendFile(path.join(buildPath, 'index.html'), (err) => {
    if (err) {
      console.warn(`⚠️  Could not serve index.html from ${buildPath}: ${err.message}`);
      res.status(404).json({ 
        message: 'Page not found',
        path: req.path,
        buildPath: buildPath
      });
    }
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
