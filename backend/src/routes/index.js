const express = require('express');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

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

module.exports = router;
