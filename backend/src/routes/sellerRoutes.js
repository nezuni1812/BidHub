const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createProductValidation,
  appendDescriptionValidation,
  denyBidderValidation,
  answerQuestionValidation,
  rateWinnerValidation,
  cancelTransactionValidation,
  paginationValidation
} = require('../validators/sellerValidator');

// All routes require authentication and seller role
router.use(authenticate);
router.use(authorize('seller', 'admin'));

/**
 * @swagger
 * /seller/products:
 *   post:
 *     summary: Create a new product for auction (Seller only)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category_id
 *               - start_price
 *               - end_time
 *               - images
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 255
 *                 example: "iPhone 15 Pro Max 256GB"
 *               description:
 *                 type: string
 *                 minLength: 50
 *                 example: "Brand new iPhone 15 Pro Max, sealed box, full warranty..."
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               start_price:
 *                 type: number
 *                 minimum: 1000
 *                 example: 25000000
 *               buy_now_price:
 *                 type: number
 *                 minimum: 1000
 *                 example: 35000000
 *               bid_step:
 *                 type: number
 *                 minimum: 1000
 *                 example: 500000
 *               auto_extend:
 *                 type: boolean
 *                 example: true
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T23:59:59Z"
 *               images:
 *                 type: array
 *                 minItems: 3
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/img1.jpg", "https://example.com/img2.jpg", "https://example.com/img3.jpg"]
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.post(
  '/products',
  createProductValidation,
  validate,
  sellerController.createProduct
);

/**
 * @swagger
 * /seller/products/{productId}/description:
 *   post:
 *     summary: Append additional description to product
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - additional_description
 *             properties:
 *               additional_description:
 *                 type: string
 *                 minLength: 10
 *                 example: "Updated: Battery health is 100%. Comes with original charger."
 *     responses:
 *       200:
 *         description: Description appended successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not product owner
 *       404:
 *         description: Product not found
 */
router.post(
  '/products/:productId/description',
  appendDescriptionValidation,
  validate,
  sellerController.appendDescription
);

/**
 * @swagger
 * /seller/products/{productId}/deny-bidder:
 *   post:
 *     summary: Deny a bidder from bidding on product
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bidder_id
 *             properties:
 *               bidder_id:
 *                 type: integer
 *                 example: 5
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Suspicious bidding behavior"
 *     responses:
 *       200:
 *         description: Bidder denied successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not product owner
 *       404:
 *         description: Product not found
 */
router.post(
  '/products/:productId/deny-bidder',
  denyBidderValidation,
  validate,
  sellerController.denyBidder
);

/**
 * @swagger
 * /seller/questions/{questionId}/answer:
 *   post:
 *     summary: Answer a question about your product
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answer
 *             properties:
 *               answer:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 example: "Yes, this product is brand new and comes with full warranty."
 *     responses:
 *       200:
 *         description: Question answered successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not product owner
 *       404:
 *         description: Question not found
 */
router.post(
  '/questions/:questionId/answer',
  answerQuestionValidation,
  validate,
  sellerController.answerQuestion
);

/**
 * @swagger
 * /seller/products/active:
 *   get:
 *     summary: Get seller's active products (ongoing auctions)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Active products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/products/active',
  paginationValidation,
  validate,
  sellerController.getActiveProducts
);

/**
 * @swagger
 * /seller/products/completed:
 *   get:
 *     summary: Get seller's completed products with winners
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Completed products retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/products/completed',
  paginationValidation,
  validate,
  sellerController.getCompletedProducts
);

/**
 * @swagger
 * /seller/products/{productId}/rate-winner:
 *   post:
 *     summary: Rate the auction winner (+1 or -1)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: integer
 *                 enum: [1, -1]
 *                 example: 1
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Great buyer, fast payment!"
 *     responses:
 *       200:
 *         description: Winner rated successfully
 *       400:
 *         description: Validation error or already rated
 *       403:
 *         description: Not product owner
 *       404:
 *         description: Product not found
 */
router.post(
  '/products/:productId/rate-winner',
  rateWinnerValidation,
  validate,
  sellerController.rateWinner
);

/**
 * @swagger
 * /seller/products/{productId}/cancel-transaction:
 *   post:
 *     summary: Cancel transaction and automatically rate winner -1 (for non-payment)
 *     tags: [Seller]
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
 *         description: Transaction cancelled and winner rated negatively
 *       400:
 *         description: No winner or already processed
 *       403:
 *         description: Not product owner
 *       404:
 *         description: Product not found
 */
router.post(
  '/products/:productId/cancel-transaction',
  cancelTransactionValidation,
  validate,
  sellerController.cancelTransaction
);

module.exports = router;
