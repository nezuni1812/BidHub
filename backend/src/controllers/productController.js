const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError } = require('../utils/errors');

/**
 * @desc    Get homepage data (top 5 products)
 * @route   GET /api/v1/products/home
 * @access  Public
 */
const getHomePage = asyncHandler(async (req, res) => {
  const data = await Product.getHomePage();
  
  res.json({
    success: true,
    data: {
      ending_soon: data.endingSoon,
      most_bids: data.mostBids,
      highest_price: data.highestPrice
    }
  });
});

/**
 * @desc    Search/filter products
 * @route   GET /api/v1/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    category_id,
    sort_by,
    page,
    page_size
  } = req.query;
  
  const result = await Product.searchWithFilters({
    keyword,
    category_id,
    sort_by,
    page,
    page_size
  });
  
  res.json({
    success: true,
    ...result
  });
});

/**
 * @desc    Get product detail
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.getById(req.params.id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Get product bid history
 * @route   GET /api/v1/products/:id/bids
 * @access  Public
 */
const getProductBids = asyncHandler(async (req, res) => {
  const { page, page_size } = req.query;
  
  const result = await Product.getBidHistory(
    req.params.id,
    page,
    page_size
  );
  
  res.json({
    success: true,
    ...result
  });
});

module.exports = {
  getHomePage,
  getProducts,
  getProductById,
  getProductBids
};
