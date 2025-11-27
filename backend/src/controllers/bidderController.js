const asyncHandler = require('../middleware/asyncHandler');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');
const Watchlist = require('../models/Watchlist');
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const User = require('../models/User');
const Question = require('../models/Question');
const Rating = require('../models/Rating');
const UpgradeRequest = require('../models/UpgradeRequest');
const db = require('../config/database');

/**
 * @desc    Add product to watchlist
 * @route   POST /api/v1/bidder/watchlist
 * @access  Private (Bidder)
 */
const addToWatchlist = asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  
  // Check if product exists
  const product = await Product.getById(product_id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  const watchlist = await Watchlist.add(req.user.id, product_id);
  
  res.status(201).json({
    success: true,
    message: 'Product added to watchlist',
    data: watchlist
  });
});

/**
 * @desc    Remove product from watchlist
 * @route   DELETE /api/v1/bidder/watchlist/:productId
 * @access  Private (Bidder)
 */
const removeFromWatchlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const watchlist = await Watchlist.remove(req.user.id, productId);
  
  if (!watchlist) {
    throw new NotFoundError('Product not in watchlist');
  }
  
  res.json({
    success: true,
    message: 'Product removed from watchlist'
  });
});

/**
 * @desc    Get user watchlist
 * @route   GET /api/v1/bidder/watchlist
 * @access  Private (Bidder)
 */
const getWatchlist = asyncHandler(async (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  
  const result = await Watchlist.getByUserId(req.user.id, page, page_size);
  
  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  });
});

/**
 * @desc    Place a bid on product
 * @route   POST /api/v1/bidder/bid
 * @access  Private (Bidder)
 */
const placeBid = asyncHandler(async (req, res) => {
  const { product_id, bid_price } = req.body;
  const userId = req.user.id;
  
  // Get product details
  const product = await Product.getById(product_id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  // Check if product is active
  if (product.status !== 'active') {
    throw new BadRequestError('Product is not available for bidding');
  }
  
  // Check if auction has ended
  if (new Date(product.end_time) < new Date()) {
    throw new BadRequestError('Auction has ended');
  }
  
  // Check if bidder is the seller
  if (product.seller_id === userId) {
    throw new ForbiddenError('You cannot bid on your own product');
  }
  
  // Check if bidder is denied
  const deniedQuery = `
    SELECT id FROM denied_bidders
    WHERE product_id = $1 AND user_id = $2
  `;
  const deniedResult = await db.query(deniedQuery, [product_id, userId]);
  if (deniedResult.rows.length > 0) {
    throw new ForbiddenError('You are not allowed to bid on this product');
  }
  
  // Get bidder rating stats
  const ratingStats = await Rating.getUserRatingStats(userId);
  const totalRatings = parseInt(ratingStats.total_ratings);
  const positivePercentage = parseFloat(ratingStats.positive_percentage) || 0;
  
  // Check rating requirement
  if (totalRatings > 0 && positivePercentage < 80) {
    throw new ForbiddenError('Your rating must be at least 80% to bid on this product');
  }
  
  // Check if seller allows unrated bidders
  if (totalRatings === 0) {
    const settingQuery = `
      SELECT setting_value FROM system_settings
      WHERE setting_key = 'allow_unrated_bidders'
    `;
    const settingResult = await db.query(settingQuery);
    const allowUnrated = settingResult.rows[0]?.setting_value === 'true';
    
    if (!allowUnrated) {
      throw new ForbiddenError('You need ratings to bid on this product');
    }
  }
  
  // Validate bid price
  const minValidBid = parseFloat(product.current_price) + parseFloat(product.bid_step);
  if (bid_price < minValidBid) {
    throw new BadRequestError(`Minimum bid must be ${minValidBid.toLocaleString('vi-VN')} VND`);
  }
  
  // Create bid
  const bid = await Bid.create(product_id, userId, bid_price);
  
  // Note: Trigger will automatically update product.current_price and total_bids
  
  res.status(201).json({
    success: true,
    message: 'Bid placed successfully',
    data: {
      bid_id: bid.id,
      product_id,
      bid_price,
      created_at: bid.created_at,
      next_min_bid: bid_price + parseFloat(product.bid_step)
    }
  });
});

/**
 * @desc    Ask question about product
 * @route   POST /api/v1/bidder/questions
 * @access  Private (Bidder)
 */
const askQuestion = asyncHandler(async (req, res) => {
  const { product_id, question } = req.body;
  
  // Check if product exists
  const product = await Product.getById(product_id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  const questionRecord = await Question.create(product_id, req.user.id, question);
  
  // TODO: Send email notification to seller
  
  res.status(201).json({
    success: true,
    message: 'Question submitted successfully',
    data: questionRecord
  });
});

/**
 * @desc    Get user bidding products
 * @route   GET /api/v1/bidder/bidding
 * @access  Private (Bidder)
 */
const getBiddingProducts = asyncHandler(async (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  
  const result = await Bid.getUserBiddingProducts(req.user.id, page, page_size);
  
  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  });
});

/**
 * @desc    Get user won products
 * @route   GET /api/v1/bidder/won
 * @access  Private (Bidder)
 */
const getWonProducts = asyncHandler(async (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  
  const result = await Bid.getUserWonProducts(req.user.id, page, page_size);
  
  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  });
});

/**
 * @desc    Get user profile with ratings
 * @route   GET /api/v1/bidder/profile
 * @access  Private (Bidder)
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const ratings = await Rating.getUserRatings(req.user.id);
  const ratingStats = await Rating.getUserRatingStats(req.user.id);
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        address: user.address,
        date_of_birth: user.date_of_birth,
        role: user.role,
        rating: user.rating,
        created_at: user.created_at
      },
      rating_stats: ratingStats,
      ratings
    }
  });
});

/**
 * @desc    Rate a user (seller)
 * @route   POST /api/v1/bidder/rate
 * @access  Private (Bidder)
 */
const rateUser = asyncHandler(async (req, res) => {
  const { rated_user_id, product_id, score, comment } = req.body;
  
  // Validate score
  if (![1, -1].includes(score)) {
    throw new BadRequestError('Score must be 1 or -1');
  }
  
  // Check if user can rate
  const canRate = await Rating.canRate(req.user.id, rated_user_id, product_id);
  if (!canRate) {
    throw new BadRequestError('You have already rated this user for this product');
  }
  
  const rating = await Rating.create(req.user.id, rated_user_id, product_id, score, comment);
  
  res.status(201).json({
    success: true,
    message: 'Rating submitted successfully',
    data: rating
  });
});

/**
 * @desc    Request upgrade to seller
 * @route   POST /api/v1/bidder/upgrade-request
 * @access  Private (Bidder)
 */
const requestUpgrade = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Check if user already has pending request
  const hasPending = await UpgradeRequest.hasPendingRequest(userId);
  if (hasPending) {
    throw new BadRequestError('You already have a pending upgrade request');
  }
  
  // Check if user is already a seller
  const user = await User.findById(userId);
  if (user.role === 'seller') {
    throw new BadRequestError('You are already a seller');
  }
  
  const request = await UpgradeRequest.create(userId);
  
  res.status(201).json({
    success: true,
    message: 'Upgrade request submitted successfully. Admin will review within 7 days.',
    data: request
  });
});

/**
 * @desc    Get upgrade request status
 * @route   GET /api/v1/bidder/upgrade-request
 * @access  Private (Bidder)
 */
const getUpgradeRequest = asyncHandler(async (req, res) => {
  const request = await UpgradeRequest.getByUserId(req.user.id);
  
  res.json({
    success: true,
    data: request || null
  });
});

/**
 * @desc    Update profile
 * @route   PUT /api/v1/bidder/profile
 * @access  Private (Bidder)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, address, date_of_birth } = req.body;
  
  const query = `
    UPDATE users
    SET 
      full_name = COALESCE($1, full_name),
      address = COALESCE($2, address),
      date_of_birth = COALESCE($3, date_of_birth),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
  `;
  
  const result = await db.query(query, [full_name, address, date_of_birth, req.user.id]);
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: result.rows[0]
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/bidder/change-password
 * @access  Private (Bidder)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user.id);
  
  // Verify old password
  const isValid = await User.comparePassword(old_password, user.password_hash);
  if (!isValid) {
    throw new BadRequestError('Current password is incorrect');
  }
  
  // Hash new password
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(new_password, 10);
  
  // Update password
  const query = `
    UPDATE users
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;
  await db.query(query, [hashedPassword, req.user.id]);
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  placeBid,
  askQuestion,
  getBiddingProducts,
  getWonProducts,
  getProfile,
  rateUser,
  requestUpgrade,
  getUpgradeRequest,
  updateProfile,
  changePassword
};
