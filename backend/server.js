require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Force redeploy - v2

// Force redeploy - build path fix v2

// Load routes
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const logRoutes = require('./routes/logRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const bookmarksRoutes = require('./routes/bookmarkRoutes');
const aiRoutes = require('./routes/aiRoutes');
const holdRoutes = require('./routes/holdRoutes');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5050;

app.disable('x-powered-by');

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

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://paranaque-web-system.onrender.com https://rqseuhdpktquhlqojoqg.supabase.co https://psgc.gitlab.io https://www.google.com https://fonts.googleapis.com https://fonts.gstatic.com; frame-src https://www.google.com https://maps.google.com; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
  );
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});

// Cache prevention middleware - prevents back button access to authenticated pages
app.use((req, res, next) => {
  // Prevent caching for all responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React build folder as static files
const fs = require('fs');

// Determine the build folder location
// The build folder should be created by "npm run build" at the project root
// __dirname is /backend, so we go up one level to get to the project root

// Try these paths in order of preference
const possibleBuildPaths = [
  path.join(__dirname, '../build'),           // Most likely: /backend/../build = /build ✅
  path.join(__dirname, '../src/build'),       // Alternative: /backend/../src/build = /src/build
  path.join(__dirname, '../../build'),        // Fallback: /backend/../../build = /build
  path.resolve(__dirname, '../build'),        // Absolute path resolution
];

let buildPath = null;

console.log(`\n📁 ========== BUILD PATH DETECTION ==========`);
console.log(`📁 Backend __dirname: ${__dirname}`);
console.log(`📁 Project root: ${path.join(__dirname, '..')}`);
console.log(`📁 Checking possible build paths:\n`);

// Find the first path that has a build folder with index.html
for (const testPath of possibleBuildPaths) {
  const folderExists = fs.existsSync(testPath);
  const indexPath = path.join(testPath, 'index.html');
  const indexExists = folderExists && fs.existsSync(indexPath);
  
  console.log(`📁   [${folderExists ? '✅' : '❌'} folder] [${indexExists ? '✅' : '❌'} index.html] ${testPath}`);
  
  if (indexExists) {
    buildPath = testPath;
    console.log(`\n✅ Build folder found at: ${buildPath}\n`);
    break;
  }
}

// If still not found, try to list the project root to debug
if (!buildPath) {
  console.log(`\n⚠️  Build folder not found. Listing project root contents:`);
  const projectRoot = path.join(__dirname, '..');
  try {
    const files = fs.readdirSync(projectRoot);
    files.slice(0, 15).forEach(f => {
      const fullPath = path.join(projectRoot, f);
      const isDir = fs.statSync(fullPath).isDirectory();
      console.log(`   ${isDir ? '📁' : '📄'} ${f}`);
    });
  } catch (e) {
    console.error(`   Cannot read project root: ${e.message}`);
  }
  
  buildPath = possibleBuildPaths[0]; // Use first path as fallback
  console.error(`\n⚠️  Using fallback buildPath: ${buildPath}`);
}

console.log(`📁 Final buildPath: ${buildPath}`);
console.log(`📁 ========================================\n`);

app.use(express.static(buildPath, {
  index: false,
  setHeaders: (res, filePath) => {
    const relativePath = path.relative(buildPath, filePath);
    if (relativePath.startsWith(`static${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.removeHeader('Pragma');
      res.removeHeader('Expires');
      res.removeHeader('Surrogate-Control');
    }
  }
}));

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
app.use("/api/holds", holdRoutes);

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
  const indexPath = path.join(buildPath, 'index.html');
  
  // Debug logging
  console.log(`\n📱 ========== SPA REQUEST ==========`);
  console.log(`📱 Path: ${req.path}`);
  console.log(`📱 Build Path: ${buildPath}`);
  console.log(`📱 Looking for index.html at: ${indexPath}`);
  
  // Check if build path exists
  if (!fs.existsSync(buildPath)) {
    console.error(`📱 ❌ Build folder does NOT exist`);
    return res.status(500).json({ 
      message: 'Build folder not found',
      buildPath: buildPath
    });
  }
  
  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error(`📱 ❌ index.html does NOT exist at ${indexPath}`);
    try {
      const files = fs.readdirSync(buildPath);
      console.error(`📱 Files in build folder: ${files.slice(0, 10).join(', ')}`);
    } catch (e) {
      console.error(`📱 Cannot read build folder contents`);
    }
    return res.status(500).json({ 
      message: 'index.html not found',
      buildPath: buildPath,
      indexPath: indexPath
    });
  }
  
  // Serve index.html
  console.log(`📱 ✅ Serving index.html from ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`📱 ❌ Error serving index.html: ${err.message}`);
      res.status(500).json({ 
        message: 'Could not serve index.html',
        error: err.message
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
