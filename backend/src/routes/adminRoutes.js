const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminValidator = require('../validators/adminValidator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));

// ================================================
// CATEGORY MANAGEMENT ROUTES
// ================================================

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Get all categories with statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, created_at, total_products, total_revenue]
 *           default: name
 *     responses:
 *       200:
 *         description: List of categories with statistics
 */
router.get('/categories', adminController.getAllCategories);

/**
 * @swagger
 * /admin/categories/{id}:
 *   get:
 *     summary: Get category by ID with statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category details with statistics
 */
router.get(
  '/categories/:id',
  adminValidator.getCategoryById, validate,
  adminController.getCategoryById
);

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Create new category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post(
  '/categories',
  adminValidator.createCategory, validate,
  adminController.createCategory
);

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put(
  '/categories/:id',
  adminValidator.updateCategory, validate,
  adminController.updateCategory
);

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Delete category (only if no products)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category with products
 */
router.delete(
  '/categories/:id',
  adminValidator.deleteCategory, validate,
  adminController.deleteCategory
);

// ================================================
// PRODUCT MANAGEMENT ROUTES
// ================================================

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all products (admin view with filters)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, active, ended, removed]
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: seller_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 */
router.get(
  '/products',
  adminValidator.getProducts, validate,
  adminController.getAllProducts
);

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Get product by ID (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details with full information
 */
router.get(
  '/products/:id',
  adminValidator.getProductById, validate,
  adminController.getProductById
);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Remove product (admin action)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product removed successfully
 */
router.delete(
  '/products/:id',
  adminValidator.removeProduct, validate,
  adminController.removeProduct
);

// ================================================
// USER MANAGEMENT ROUTES
// ================================================

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [bidder, seller, admin]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  '/users',
  adminValidator.getUsers, validate,
  adminController.getAllUsers
);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details with statistics
 */
router.get(
  '/users/:id',
  adminValidator.getUserById, validate,
  adminController.getUserById
);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user (admin action)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [bidder, seller, admin]
 *               is_active:
 *                 type: boolean
 *               address:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put(
  '/users/:id',
  adminValidator.updateUser, validate,
  adminController.updateUser
);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete(
  '/users/:id',
  adminValidator.deleteUser, validate,
  adminController.deleteUser
);

// ================================================
// UPGRADE REQUEST ROUTES
// ================================================

/**
 * @swagger
 * /admin/upgrade-requests:
 *   get:
 *     summary: Get all upgrade requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           default: pending
 *     responses:
 *       200:
 *         description: List of upgrade requests
 */
router.get(
  '/upgrade-requests',
  adminValidator.getUpgradeRequests, validate,
  adminController.getUpgradeRequests
);

/**
 * @swagger
 * /admin/upgrade-requests/{id}:
 *   get:
 *     summary: Get upgrade request by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Upgrade request details
 */
router.get(
  '/upgrade-requests/:id',
  adminValidator.getUpgradeRequestById, validate,
  adminController.getUpgradeRequestById
);

/**
 * @swagger
 * /admin/upgrade-requests/{id}/approve:
 *   post:
 *     summary: Approve upgrade request (bidder → seller)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Upgrade request approved successfully
 */
router.post(
  '/upgrade-requests/:id/approve',
  adminValidator.approveUpgradeRequest, validate,
  adminController.approveUpgradeRequest
);

/**
 * @swagger
 * /admin/upgrade-requests/{id}/reject:
 *   post:
 *     summary: Reject upgrade request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upgrade request rejected
 */
router.post(
  '/upgrade-requests/:id/reject',
  adminValidator.rejectUpgradeRequest, validate,
  adminController.rejectUpgradeRequest
);

// ================================================
// DASHBOARD STATISTICS ROUTES
// ================================================

/**
 * @swagger
 * /admin/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['7d', '30d', '90d', '1y']
 *           default: '30d'
 *     responses:
 *       200:
 *         description: Dashboard overview data
 */
router.get(
  '/dashboard/overview',
  adminValidator.getDashboardOverview, validate,
  adminController.getDashboardOverview
);

/**
 * @swagger
 * /admin/dashboard/auctions:
 *   get:
 *     summary: Get auction statistics (chart data)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['7d', '30d', '90d', '1y']
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Auction statistics over time
 */
router.get(
  '/dashboard/auctions',
  adminValidator.getStatsWithInterval, validate,
  adminController.getAuctionStats
);

/**
 * @swagger
 * /admin/dashboard/revenue:
 *   get:
 *     summary: Get revenue statistics (chart data)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['7d', '30d', '90d', '1y']
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Revenue statistics over time
 */
router.get(
  '/dashboard/revenue',
  adminValidator.getStatsWithInterval, validate,
  adminController.getRevenueStats
);

/**
 * @swagger
 * /admin/dashboard/users:
 *   get:
 *     summary: Get user growth statistics (chart data)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['7d', '30d', '90d', '1y']
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: User growth statistics over time
 */
router.get(
  '/dashboard/users',
  adminValidator.getStatsWithInterval, validate,
  adminController.getUserStats
);

/**
 * @swagger
 * /admin/dashboard/top-sellers:
 *   get:
 *     summary: Get top sellers by revenue
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['7d', '30d', '90d', '1y']
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top sellers list
 */
router.get(
  '/dashboard/top-sellers',
  adminValidator.getTopUsers, validate,
  adminController.getTopSellers
);

/**
 * @swagger
 * /admin/dashboard/top-bidders:
 *   get:
 *     summary: Get top bidders by activity
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['7d', '30d', '90d', '1y']
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top bidders list
 */
router.get(
  '/dashboard/top-bidders',
  adminValidator.getTopUsers, validate,
  adminController.getTopBidders
);

/**
 * @swagger
 * /admin/dashboard/categories:
 *   get:
 *     summary: Get category performance statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['7d', '30d', '90d', '1y']
 *     responses:
 *       200:
 *         description: Category performance data
 */
router.get(
  '/dashboard/categories',
  adminValidator.getCategoryStats, validate,
  adminController.getCategoryStats
);

module.exports = router;

