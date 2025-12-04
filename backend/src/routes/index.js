const express = require('express');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const authRoutes = require('./authRoutes');
const bidderRoutes = require('./bidderRoutes');
const sellerRoutes = require('./sellerRoutes');
const adminRoutes = require('./adminRoutes');
const orderRoutes = require('./orderRoutes');
const chatRoutes = require('./chatRoutes');

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
      seller: '/api/v1/seller',
      admin: '/api/v1/admin',
      orders: '/api/v1/orders',
      chat: '/api/v1/chat'
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
router.use('/admin', adminRoutes);
router.use('/orders', orderRoutes);
router.use('/chat', chatRoutes);

module.exports = router;

