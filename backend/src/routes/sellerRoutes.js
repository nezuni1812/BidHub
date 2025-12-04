const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  createProductValidation,
  appendDescriptionValidation,
  denyBidderValidation,
  answerQuestionValidation,
  rateWinnerValidation,
  cancelTransactionValidation,
  allowUnratedBidderValidation,
  paginationValidation
} = require('../validators/sellerValidator');

// All routes require authentication and seller role
router.use(authenticate);
router.use(authorize('seller', 'admin'));

/**
 * @swagger
 * /seller/products:
 *   post:
 *     summary: Create a new product with image upload to Cloudflare R2 (Seller only)
 *     description: Upload product images to Cloudflare R2 and create auction product. Requires 1 main image and at least 3 additional images.
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category_id
 *               - start_price
 *               - end_time
 *               - main_image
 *               - additional_images
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 255
 *                 example: "iPhone 15 Pro Max 256GB - Chính hãng VN/A"
 *               description:
 *                 type: string
 *                 minLength: 50
 *                 example: "Máy mới 100% nguyên seal, chưa active, fullbox đầy đủ phụ kiện. Bảo hành chính hãng Apple 12 tháng tại các trung tâm bảo hành ủy quyền trên toàn quốc."
 *               category_id:
 *                 type: integer
 *                 example: 1
 *                 description: "Category ID (1=Electronics, 2=Fashion, etc.)"
 *               start_price:
 *                 type: number
 *                 minimum: 1000
 *                 example: 25000000
 *                 description: "Starting price in VND"
 *               buy_now_price:
 *                 type: number
 *                 minimum: 1000
 *                 example: 35000000
 *                 description: "Buy now price (optional)"
 *               bid_step:
 *                 type: number
 *                 minimum: 1000
 *                 example: 500000
 *                 description: "Minimum bid increment (default: 10000)"
 *               auto_extend:
 *                 type: boolean
 *                 example: true
 *                 description: "Auto-extend auction by 10 minutes if bid within last 5 minutes"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T23:59:59Z"
 *                 description: "Auction end time (ISO 8601 format)"
 *               main_image:
 *                 type: string
 *                 format: binary
 *                 description: "Main product image (JPEG/PNG/WEBP, max 5MB) - REQUIRED"
 *               additional_images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: "At least 3 additional images (JPEG/PNG/WEBP, max 5MB each) - REQUIRED"
 *                 minItems: 3
 *                 maxItems: 9
 *     responses:
 *       201:
 *         description: Product created successfully with images uploaded to R2
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
 *                   example: "Product created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     title:
 *                       type: string
 *                     current_price:
 *                       type: number
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                             example: "https://images.bidhub.com/products/1701234567890-abc123.jpg"
 *                           is_main:
 *                             type: boolean
 *       400:
 *         description: Validation error or missing images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Vui lòng upload ảnh đại diện và ít nhất 3 ảnh phụ"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.post(
  '/products',
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'additional_images', maxCount: 9 }
  ]),
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

/**
 * @swagger
 * /seller/products/{productId}/allow-unrated-bidder/{bidderId}:
 *   post:
 *     summary: Allow unrated bidder to bid on product
 *     description: Grant permission for a bidder with no ratings to participate in the auction. This is needed because normally bidders need 80%+ positive rating or at least some ratings to bid.
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: path
 *         name: bidderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bidder user ID with no ratings
 *     responses:
 *       200:
 *         description: Permission granted successfully
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
 *                   example: "Unrated bidder permission granted"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     bidder_id:
 *                       type: integer
 *       400:
 *         description: Bidder already has ratings or auction not active
 *       403:
 *         description: Not product owner
 *       404:
 *         description: Product or bidder not found
 */
router.post(
  '/products/:productId/allow-unrated-bidder/:bidderId',
  allowUnratedBidderValidation,
  validate,
  sellerController.allowUnratedBidder
);

module.exports = router;
