const express = require('express');
const router = express.Router();
const {
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
  changePassword,
  setAutoBid,
  getAutoBids,
  cancelAutoBid
} = require('../controllers/bidderController');
const {
  addToWatchlistValidation,
  removeFromWatchlistValidation,
  placeBidValidation,
  askQuestionValidation,
  rateUserValidation,
  updateProfileValidation,
  changePasswordValidation,
  paginationValidation,
  setAutoBidValidation,
  cancelAutoBidValidation
} = require('../validators/bidderValidator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and bidder/seller role
router.use(authenticate);

/**
 * @swagger
 * /bidder/watchlist:
 *   post:
 *     tags: [Bidder]
 *     summary: Add product to watchlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *             properties:
 *               product_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product added to watchlist
 *       401:
 *         description: Unauthorized
 */
router.post('/watchlist', addToWatchlistValidation, validate, addToWatchlist);

/**
 * @swagger
 * /bidder/watchlist:
 *   get:
 *     tags: [Bidder]
 *     summary: Get user watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Watchlist retrieved
 */
router.get('/watchlist', paginationValidation, validate, getWatchlist);

/**
 * @swagger
 * /bidder/watchlist/{productId}:
 *   delete:
 *     tags: [Bidder]
 *     summary: Remove product from watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product removed from watchlist
 */
router.delete('/watchlist/:productId', removeFromWatchlistValidation, validate, removeFromWatchlist);

/**
 * @swagger
 * /bidder/bid:
 *   post:
 *     tags: [Bidder]
 *     summary: Place a bid on product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - bid_price
 *             properties:
 *               product_id:
 *                 type: integer
 *               bid_price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bid placed successfully
 *       400:
 *         description: Invalid bid
 *       403:
 *         description: Not allowed to bid
 */
router.post('/bid', placeBidValidation, validate, placeBid);

/**
 * @swagger
 * /bidder/questions:
 *   post:
 *     tags: [Bidder]
 *     summary: Ask question about product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - question
 *             properties:
 *               product_id:
 *                 type: integer
 *               question:
 *                 type: string
 *     responses:
 *       201:
 *         description: Question submitted
 */
router.post('/questions', askQuestionValidation, validate, askQuestion);

/**
 * @swagger
 * /bidder/bidding:
 *   get:
 *     tags: [Bidder]
 *     summary: Get products user is bidding on
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bidding products retrieved
 */
router.get('/bidding', paginationValidation, validate, getBiddingProducts);

/**
 * @swagger
 * /bidder/won:
 *   get:
 *     tags: [Bidder]
 *     summary: Get products user has won
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Won products retrieved
 */
router.get('/won', paginationValidation, validate, getWonProducts);

/**
 * @swagger
 * /bidder/profile:
 *   get:
 *     tags: [Bidder]
 *     summary: Get user profile with ratings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /bidder/profile:
 *   put:
 *     tags: [Bidder]
 *     summary: Update profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               address:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', updateProfileValidation, validate, updateProfile);

/**
 * @swagger
 * /bidder/change-password:
 *   put:
 *     tags: [Bidder]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old_password
 *               - new_password
 *             properties:
 *               old_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Invalid password
 */
router.put('/change-password', changePasswordValidation, validate, changePassword);

/**
 * @swagger
 * /bidder/rate:
 *   post:
 *     tags: [Bidder]
 *     summary: Rate a user (seller)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rated_user_id
 *               - score
 *             properties:
 *               rated_user_id:
 *                 type: integer
 *               product_id:
 *                 type: integer
 *               score:
 *                 type: integer
 *                 enum: [1, -1]
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rating submitted
 */
router.post('/rate', rateUserValidation, validate, rateUser);

/**
 * @swagger
 * /bidder/upgrade-request:
 *   post:
 *     tags: [Bidder]
 *     summary: Request upgrade to seller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Request submitted
 *       400:
 *         description: Already has pending request
 */
router.post('/upgrade-request', requestUpgrade);

/**
 * @swagger
 * /bidder/upgrade-request:
 *   get:
 *     tags: [Bidder]
 *     summary: Get upgrade request status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Request status retrieved
 */
router.get('/upgrade-request', getUpgradeRequest);

/**
 * @swagger
 * /bidder/auto-bid:
 *   post:
 *     tags: [Bidder]
 *     summary: Set auto-bid configuration
 *     description: Configure maximum price for automatic bidding. System will bid incrementally up to this limit.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - max_price
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               max_price:
 *                 type: number
 *                 format: float
 *                 example: 15000000
 *                 description: Maximum price willing to pay (VND)
 *     responses:
 *       201:
 *         description: Auto-bid configured successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Auto-bid configured successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     product_id:
 *                       type: integer
 *                     max_price:
 *                       type: number
 *                     is_active:
 *                       type: boolean
 *       400:
 *         description: Invalid request (product inactive, auction ended, max_price too low)
 *       403:
 *         description: Cannot bid on own product
 */
router.post('/auto-bid', setAutoBidValidation, validate, setAutoBid);

/**
 * @swagger
 * /bidder/auto-bid:
 *   get:
 *     tags: [Bidder]
 *     summary: Get user's active auto-bid configurations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Auto-bid list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       product_id:
 *                         type: integer
 *                       max_price:
 *                         type: number
 *                       title:
 *                         type: string
 *                       current_price:
 *                         type: number
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       image_url:
 *                         type: string
 *                 pagination:
 *                   type: object
 */
router.get('/auto-bid', paginationValidation, validate, getAutoBids);

/**
 * @swagger
 * /bidder/auto-bid/{productId}:
 *   delete:
 *     tags: [Bidder]
 *     summary: Cancel auto-bid for a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Auto-bid cancelled successfully
 *       404:
 *         description: Auto-bid not found
 */
router.delete('/auto-bid/:productId', cancelAutoBidValidation, validate, cancelAutoBid);

module.exports = router;
