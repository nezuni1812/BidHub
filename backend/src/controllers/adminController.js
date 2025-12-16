const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const UpgradeRequest = require('../models/UpgradeRequest');
const Bid = require('../models/Bid');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const asyncHandler = require('../middleware/asyncHandler');

// ================================================
// 4.1 CATEGORY MANAGEMENT
// ================================================

/**
 * @desc    Get all categories (admin view with stats)
 * @route   GET /api/v1/admin/categories
 * @access  Private/Admin
 */
exports.getAllCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, sort = 'name' } = req.query;
  const offset = (page - 1) * limit;

  const categories = await Category.findAllWithStats({
    search,
    sort,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const total = await Category.count(search);

  res.json({
    success: true,
    data: categories,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get category by ID (admin view)
 * @route   GET /api/v1/admin/categories/:id
 * @access  Private/Admin
 */
exports.getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findByIdWithStats(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  res.json({
    success: true,
    data: category
  });
});

/**
 * @desc    Create new category
 * @route   POST /api/v1/admin/categories
 * @access  Private/Admin
 */
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Check if category name already exists
  const existing = await Category.findByName(name);
  if (existing) {
    throw new BadRequestError('Category name already exists');
  }

  const category = await Category.create({ name, description });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

/**
 * @desc    Update category
 * @route   PUT /api/v1/admin/categories/:id
 * @access  Private/Admin
 */
exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check if new name conflicts with existing category
  if (name && name !== category.name) {
    const existing = await Category.findByName(name);
    if (existing && existing.id !== parseInt(id)) {
      throw new BadRequestError('Category name already exists');
    }
  }

  const updated = await Category.update(id, { name, description });

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: updated
  });
});

/**
 * @desc    Delete category (only if no products)
 * @route   DELETE /api/v1/admin/categories/:id
 * @access  Private/Admin
 */
exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check if category has products
  const productCount = await Category.getProductCount(id);
  if (productCount > 0) {
    throw new BadRequestError(
      `Cannot delete category with ${productCount} product(s). Please move or delete products first.`
    );
  }

  await Category.delete(id);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// ================================================
// 4.2 PRODUCT MANAGEMENT
// ================================================

/**
 * @desc    Get all products (admin view with filters)
 * @route   GET /api/v1/admin/products
 * @access  Private/Admin
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    category_id,
    seller_id,
    search,
    sort = 'created_at',
    order = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;

  const products = await Product.findAllAdmin({
    status,
    category_id,
    seller_id,
    search,
    sort,
    order,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const total = await Product.countAdmin({ status, category_id, seller_id, search });

  res.json({
    success: true,
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get product by ID (admin view)
 * @route   GET /api/v1/admin/products/:id
 * @access  Private/Admin
 */
exports.getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAdmin(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  res.json({
    success: true,
    data: product
  });
});

/**
 * @desc    Remove product (admin action)
 * @route   DELETE /api/v1/admin/products/:id
 * @access  Private/Admin
 */
exports.removeProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // Optional reason for removal

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Update product status to 'removed'
  await Product.updateStatus(id, 'removed');

  // Log removal action (could extend to create admin_actions table)
  console.log(`[ADMIN] Product ${id} removed by admin ${req.user.id}. Reason: ${reason || 'Not specified'}`);

  res.json({
    success: true,
    message: 'Product removed successfully'
  });
});

// ================================================
// 4.3 USER MANAGEMENT
// ================================================

/**
 * @desc    Get all users (admin view with filters)
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    is_active,
    search,
    sort = 'created_at',
    order = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;

  const users = await User.findAllAdmin({
    role,
    is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    search,
    sort,
    order,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const total = await User.countAdmin({ role, is_active, search });

  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get user by ID (admin view)
 * @route   GET /api/v1/admin/users/:id
 * @access  Private/Admin
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAdmin(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user (admin action)
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private/Admin
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, is_active, address, date_of_birth } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if email is being changed and conflicts with existing user
  if (email && email !== user.email) {
    const existing = await User.findByEmail(email);
    if (existing && existing.id !== parseInt(id)) {
      throw new BadRequestError('Email already in use');
    }
  }

  const updated = await User.updateAdmin(id, {
    full_name,
    email,
    role,
    is_active,
    address,
    date_of_birth
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updated
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent deleting own account
  if (parseInt(id) === req.user.id) {
    throw new BadRequestError('Cannot delete your own account');
  }

  // Prevent deleting admin users
  if (user.role === 'admin') {
    throw new BadRequestError('Cannot delete admin users');
  }

  await User.delete(id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// ================================================
// 4.3.1 UPGRADE REQUEST MANAGEMENT
// ================================================

/**
 * @desc    Get all upgrade requests
 * @route   GET /api/v1/admin/upgrade-requests
 * @access  Private/Admin
 */
exports.getUpgradeRequests = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status = 'pending',
    sort = 'requested_at',
    order = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;

  const requests = await UpgradeRequest.findAll({
    status,
    sort,
    order,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const total = await UpgradeRequest.count(status);

  res.json({
    success: true,
    data: requests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get upgrade request by ID
 * @route   GET /api/v1/admin/upgrade-requests/:id
 * @access  Private/Admin
 */
exports.getUpgradeRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await UpgradeRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Upgrade request not found');
  }

  res.json({
    success: true,
    data: request
  });
});

/**
 * @desc    Approve upgrade request (bidder ➠ seller)
 * @route   POST /api/v1/admin/upgrade-requests/:id/approve
 * @access  Private/Admin
 */
exports.approveUpgradeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await UpgradeRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Upgrade request not found');
  }

  if (request.status !== 'pending') {
    throw new BadRequestError(`Request is already ${request.status}`);
  }

  // Calculate expiration: 7 days from now
  const sellerUntil = new Date();
  sellerUntil.setDate(sellerUntil.getDate() + 7);

  // Update user role to seller with expiration
  await User.updateRoleWithExpiration(request.user_id, 'seller', sellerUntil);

  // Update request status
  await UpgradeRequest.updateStatus(id, 'approved', req.user.id);

  res.json({
    success: true,
    message: 'Upgrade request approved successfully. User is now a seller for 7 days.',
    data: {
      userId: request.user_id,
      expiresAt: sellerUntil
    }
  });
});

/**
 * @desc    Reject upgrade request
 * @route   POST /api/v1/admin/upgrade-requests/:id/reject
 * @access  Private/Admin
 */
exports.rejectUpgradeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const request = await UpgradeRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Upgrade request not found');
  }

  if (request.status !== 'pending') {
    throw new BadRequestError(`Request is already ${request.status}`);
  }

  // Update request status
  await UpgradeRequest.updateStatus(id, 'rejected', req.user.id, reason);

  res.json({
    success: true,
    message: 'Upgrade request rejected'
  });
});

// ================================================
// 4.4 DASHBOARD STATISTICS
// ================================================

/**
 * @desc    Get dashboard overview statistics
 * @route   GET /api/v1/admin/dashboard/overview
 * @access  Private/Admin
 */
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

  // Parse period
  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;

  const stats = await Promise.all([
    // Total counts
    User.countByRole(),
    Product.countByStatus(),
    Category.count(),
    
    // Period-based statistics
    Product.countByPeriod(days),
    User.countByPeriod(days),
    UpgradeRequest.countApprovedByPeriod(days),
    Product.getTotalRevenue(days),
    
    // Recent activity
    Product.countActive(),
    Bid.getTotalBids(days)
  ]);

  const [
    usersByRole,
    productsByStatus,
    totalCategories,
    newAuctions,
    newUsers,
    upgradedUsers,
    revenue,
    activeAuctions,
    totalBids
  ] = stats;

  res.json({
    success: true,
    data: {
      period,
      users: {
        total: Object.values(usersByRole).reduce((a, b) => a + b, 0),
        by_role: usersByRole,
        new_users: newUsers
      },
      products: {
        total: Object.values(productsByStatus).reduce((a, b) => a + b, 0),
        by_status: productsByStatus,
        new_auctions: newAuctions,
        active_auctions: activeAuctions
      },
      categories: {
        total: totalCategories
      },
      revenue: {
        total: parseFloat(revenue) || 0,
        period: `${days} days`
      },
      upgrades: {
        approved: upgradedUsers,
        period: `${days} days`
      },
      bids: {
        total: totalBids,
        period: `${days} days`
      }
    }
  });
});

/**
 * @desc    Get auction statistics (chart data)
 * @route   GET /api/v1/admin/dashboard/auctions
 * @access  Private/Admin
 */
exports.getAuctionStats = asyncHandler(async (req, res) => {
  const { period = '30d', interval = 'day' } = req.query; // day, week, month

  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;

  const stats = await Product.getStatsByInterval(days, interval);

  res.json({
    success: true,
    data: {
      period,
      interval,
      chart_data: stats
    }
  });
});

/**
 * @desc    Get revenue statistics (chart data)
 * @route   GET /api/v1/admin/dashboard/revenue
 * @access  Private/Admin
 */
exports.getRevenueStats = asyncHandler(async (req, res) => {
  const { period = '30d', interval = 'day' } = req.query;

  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;

  const stats = await Product.getRevenueByInterval(days, interval);

  res.json({
    success: true,
    data: {
      period,
      interval,
      chart_data: stats
    }
  });
});

/**
 * @desc    Get user growth statistics (chart data)
 * @route   GET /api/v1/admin/dashboard/users
 * @access  Private/Admin
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const { period = '30d', interval = 'day' } = req.query;

  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;

  const stats = await User.getStatsByInterval(days, interval);

  res.json({
    success: true,
    data: {
      period,
      interval,
      chart_data: stats
    }
  });
});

/**
 * @desc    Get top sellers by revenue
 * @route   GET /api/v1/admin/dashboard/top-sellers
 * @access  Private/Admin
 */
exports.getTopSellers = asyncHandler(async (req, res) => {
  const { period = '30d', limit = 10 } = req.query;

  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;

  const topSellers = await User.getTopSellers(days, parseInt(limit));

  res.json({
    success: true,
    data: topSellers
  });
});

/**
 * @desc    Get top bidders by activity
 * @route   GET /api/v1/admin/dashboard/top-bidders
 * @access  Private/Admin
 */
exports.getTopBidders = asyncHandler(async (req, res) => {
  const { period = '30d', limit = 10 } = req.query;

  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;

  const topBidders = await User.getTopBidders(days, parseInt(limit));

  res.json({
    success: true,
    data: topBidders
  });
});

/**
 * @desc    Get category performance statistics
 * @route   GET /api/v1/admin/dashboard/categories
 * @access  Private/Admin
 */
exports.getCategoryStats = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;

  const stats = await Category.getPerformanceStats(days);

  res.json({
    success: true,
    data: {
      period,
      categories: stats
    }
  });
});
