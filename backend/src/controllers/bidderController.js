const asyncHandler = require('../middleware/asyncHandler');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');
const { sendQuestionNotificationEmail } = require('../utils/email');
const Watchlist = require('../models/Watchlist');
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const User = require('../models/User');
const Question = require('../models/Question');
const Rating = require('../models/Rating');
const UpgradeRequest = require('../models/UpgradeRequest');
const AutoBid = require('../models/AutoBid');
const Order = require('../models/Order');
const DeniedBidder = require('../models/DeniedBidder');
const db = require('../config/database');
const EVENTS = require('../socket/events');

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
  
  // Emit socket event for real-time update
  const io = req.app.get('io');
  if (io) {
    io.to(`product-${product_id}`).emit('new-question', {
      productId: product_id,
      question: {
        id: questionRecord.id,
        question: questionRecord.question,
        user_name: req.user.full_name,
        created_at: questionRecord.created_at
      }
    });
  }
  
  // Send email notification to seller
  try {
    const seller = await User.findById(product.seller_id);
    const asker = await User.findById(req.user.id);
    
    if (seller && seller.email) {
      await sendQuestionNotificationEmail(
        seller.email,
        seller.full_name,
        product.title,
        product_id,
        question,
        asker.full_name
      );
    }
  } catch (emailError) {
    console.error('Failed to send question notification email:', emailError);
    // Don't throw error - question is still created
  }
  
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

/**
 * @desc    Set auto-bid for a product
 * @route   POST /api/v1/bidder/auto-bid
 * @access  Private (Bidder)
 */
const setAutoBid = asyncHandler(async (req, res) => {
  const { product_id, max_price } = req.body;

  // Check product exists and is active
  const product = await Product.getById(product_id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.status !== 'active') {
    throw new BadRequestError('Cannot set auto-bid on inactive product');
  }

  // Check not seller
  if (product.seller_id === req.user.id) {
    throw new ForbiddenError('Cannot bid on your own product');
  }

  // Check if user is denied
  const isDenied = await DeniedBidder.isDenied(product_id, req.user.id);
  if (isDenied) {
    throw new ForbiddenError('You have been denied from bidding on this product');
  }

  // Check auction not ended
  if (new Date(product.end_time) <= new Date()) {
    throw new BadRequestError('Auction has ended');
  }

  // Check max_price > current_price
  if (max_price <= product.current_price) {
    throw new BadRequestError(`Max price must be greater than current price (${product.current_price})`);
  }

  // Create/update auto-bid
  const autoBid = await AutoBid.createOrUpdate(req.user.id, product_id, max_price);

  res.status(201).json({
    success: true,
    message: 'Auto-bid configured successfully',
    data: autoBid
  });
});

/**
 * @desc    Get user's auto-bids
 * @route   GET /api/v1/bidder/auto-bid
 * @access  Private (Bidder)
 */
const getAutoBids = asyncHandler(async (req, res) => {
  const { page = 1, page_size = 20 } = req.query;

  const result = await AutoBid.getUserAutoBids(req.user.id, page, page_size);

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  });
});

/**
 * @desc    Cancel auto-bid
 * @route   DELETE /api/v1/bidder/auto-bid/:productId
 * @access  Private (Bidder)
 */
const cancelAutoBid = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const autoBid = await AutoBid.deactivate(req.user.id, productId);

  if (!autoBid) {
    throw new NotFoundError('Auto-bid not found');
  }

  res.json({
    success: true,
    message: 'Auto-bid cancelled successfully',
    data: autoBid
  });
});

/**
 * @desc    Get user's max price history for a product
 * @route   GET /api/v1/bidder/auto-bid/:productId/history
 * @access  Private (Bidder)
 */
const getAutoBidHistory = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const history = await AutoBid.getMaxPriceHistory(req.user.id, productId);
  
  res.status(200).json({
    success: true,
    data: history || null
  });
});

/**
 * @desc    Buy Now - Instantly purchase product at buy_now_price
 * @route   POST /api/v1/bidder/buy-now/:productId
 * @access  Private (Bidder)
 */
const buyNow = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const buyerId = req.user.id;

  console.log(`[BUY NOW] User ${buyerId} attempting to buy product ${productId}`);

  // Execute buy now (ends auction, sets winner, updates product)
  const product = await Product.buyNowInstant(productId, buyerId);
  console.log(`[BUY NOW] Product ${productId} purchased successfully. Winner: ${buyerId}, Price: ${product.buy_now_price}`);

  // Create order for the purchase
  const order = await Order.create(
    product.id,
    buyerId,
    product.seller_id,
    product.buy_now_price
  );
  console.log(`[BUY NOW] Order created: ${order.id}, Status: ${order.order_status}, Payment: ${order.payment_status}`);

  // Get socket.io instance from app
  const io = req.app.get('io');

  if (io) {
    // Broadcast to all users watching this product
    io.to(`product-${product.id}`).emit(EVENTS.AUCTION_ENDED, {
      productId: product.id,
      productTitle: product.title,
      finalPrice: product.buy_now_price,
      hasWinner: true,
      winnerId: buyerId,
      winnerName: product.buyer_name,
      type: 'buy_now',
      message: 'Sản phẩm đã được mua ngay'
    });

    // Notify buyer (winner)
    io.to(`user-${buyerId}`).emit(EVENTS.AUCTION_ENDED, {
      productId: product.id,
      productTitle: product.title,
      finalPrice: product.buy_now_price,
      type: 'buy_now_winner',
      message: `Bạn đã mua thành công "${product.title}" với giá ${product.buy_now_price.toLocaleString('vi-VN')} VND`,
      orderId: order.id
    });

    // Notify seller
    io.to(`user-${product.seller_id}`).emit(EVENTS.AUCTION_ENDED, {
      productId: product.id,
      productTitle: product.title,
      finalPrice: product.buy_now_price,
      type: 'buy_now_seller',
      message: `Sản phẩm "${product.title}" đã được mua ngay với giá ${product.buy_now_price.toLocaleString('vi-VN')} VND`,
      buyerName: product.buyer_name,
      buyerEmail: product.buyer_email,
      orderId: order.id
    });
  }

  res.status(200).json({
    success: true,
    message: 'Product purchased successfully',
    data: {
      product: {
        id: product.id,
        title: product.title,
        finalPrice: product.buy_now_price,
        seller: {
          id: product.seller_id,
          name: product.seller_name
        }
      },
      order: {
        id: order.id,
        total_price: order.total_price,
        order_status: order.order_status,
        payment_status: order.payment_status,
        created_at: order.created_at
      }
    }
  });
});

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  askQuestion,
  getBiddingProducts,
  getWonProducts,
  getProfile,
  rateUser,
  requestUpgrade,
  getUpgradeRequest,
  updateProfile,
  changePassword,
  setAutoBid,
  getAutoBids,
  cancelAutoBid,
  getAutoBidHistory,
  buyNow
};
