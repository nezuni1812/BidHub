const { body, param, query } = require('express-validator');

// ================================================
// CATEGORY VALIDATION
// ================================================

const createCategory = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
];

const updateCategory = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid category ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters')
];

const getCategoryById = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid category ID')
];

const deleteCategory = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid category ID')
];

// ================================================
// PRODUCT VALIDATION
// ================================================

const getProducts = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'active', 'ended', 'removed']).withMessage('Invalid status'),
  query('category_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid category ID'),
  query('seller_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid seller ID'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search term too long'),
  query('sort')
    .optional()
    .isIn(['created_at', 'name', 'current_price', 'end_time', 'bid_count']).withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC')
];

const getProductById = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid product ID')
];

const removeProduct = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

// ================================================
// USER VALIDATION
// ================================================

const getUsers = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['bidder', 'seller', 'admin']).withMessage('Invalid role'),
  query('is_active')
    .optional()
    .isIn(['true', 'false']).withMessage('is_active must be true or false'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search term too long'),
  query('sort')
    .optional()
    .isIn(['created_at', 'full_name', 'email', 'rating']).withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC')
];

const getUserById = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

const updateUser = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('role')
    .optional()
    .isIn(['bidder', 'seller', 'admin']).withMessage('Invalid role'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
  body('address')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Address too long'),
  body('date_of_birth')
    .optional({ nullable: true })
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    })
];

const deleteUser = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

// ================================================
// UPGRADE REQUEST VALIDATION
// ================================================

const getUpgradeRequests = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at']).withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC')
];

const getUpgradeRequestById = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid request ID')
];

const approveUpgradeRequest = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid request ID')
];

const rejectUpgradeRequest = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid request ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

// ================================================
// DASHBOARD VALIDATION
// ================================================

const getDashboardOverview = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
];

const getStatsWithInterval = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('interval')
    .optional()
    .isIn(['day', 'week', 'month']).withMessage('Invalid interval')
];

const getTopUsers = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

const getCategoryStats = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
];

module.exports = {
  // Category
  createCategory,
  updateCategory,
  getCategoryById,
  deleteCategory,

  // Product
  getProducts,
  getProductById,
  removeProduct,

  // User
  getUsers,
  getUserById,
  updateUser,
  deleteUser,

  // Upgrade Request
  getUpgradeRequests,
  getUpgradeRequestById,
  approveUpgradeRequest,
  rejectUpgradeRequest,

  // Dashboard
  getDashboardOverview,
  getStatsWithInterval,
  getTopUsers,
  getCategoryStats
};
