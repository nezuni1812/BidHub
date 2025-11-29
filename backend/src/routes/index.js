const express = require('express');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const authRoutes = require('./authRoutes');
const bidderRoutes = require('./bidderRoutes');
const sellerRoutes = require('./sellerRoutes');

const router = express.Router();

// API root endpoint
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Welcome to BidHub API',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      documentation: '/api-docs',
      auth: '/api/v1/auth',
      categories: '/api/v1/categories',
      products: '/api/v1/products',
      bidder: '/api/v1/bidder',
      seller: '/api/v1/seller'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'BidHub API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/auth', authRoutes);
router.use('/bidder', bidderRoutes);
router.use('/seller', sellerRoutes);

module.exports = router;

