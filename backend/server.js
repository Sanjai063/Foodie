const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// CORS Configuration: support production frontend domains, Render domains, and local dev
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (Postman, curl, server-to-server, health check)
    if (!origin) return callback(null, true);

    // If wildcard origin configured
    if (process.env.CLIENT_URL === '*' || process.env.FRONTEND_URL === '*') {
      return callback(null, true);
    }

    // Match exact or trailing-slash normalized allowed origin
    const isExplicitlyAllowed = allowedOrigins.some(allowed => 
      origin === allowed || origin.replace(/\/$/, '') === allowed.replace(/\/$/, '')
    );
    if (isExplicitlyAllowed) {
      return callback(null, true);
    }

    // Automatically allow any Render deployment domain (*.onrender.com) for smooth deployment
    if (origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }

    // Allow any localhost/127.0.0.1 port during testing
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // If neither CLIENT_URL nor FRONTEND_URL is set in environment, allow origin to prevent lockouts
    if (!process.env.CLIENT_URL && !process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for development / viva demonstration
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Online Food Ordering System API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend entry point for any unspecified client route
app.get('*', (req, res) => {
  // If it is an API route that reached here, return 404 JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database connection & Server initialization
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_ordering_db';

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  Notice: MONGODB_URI not detected in environment variables. Falling back to local MongoDB.');
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  Notice: JWT_SECRET not detected in environment variables. Using development fallback secret.');
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('----------------------------------------------------');
    console.log('  MongoDB connected successfully!');
    console.log(`  Database: ${mongoose.connection.name}`);
    console.log('----------------------------------------------------');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`  Server running on port ${PORT} (bound to 0.0.0.0)`);
      console.log(`  Local API URL: http://localhost:${PORT}/api`);
      console.log(`  Health Check:  http://localhost:${PORT}/api/health`);
      console.log(`  Frontend Host: http://localhost:${PORT}`);
      console.log(`  Admin Panel:   http://localhost:${PORT}/admin/login.html`);
      console.log('----------------------------------------------------');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Verify that MONGODB_URI is correctly set and MongoDB Atlas Network Access allows 0.0.0.0/0.');
    process.exit(1);
  });
