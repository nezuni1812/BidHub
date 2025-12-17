const express = require('express');
const router = express.Router();
const {
  getOrderDetails,
  getOrderByProduct,
  updatePayment,
  updateShippingAddress,
  updateShipping,
  confirmDelivery,
  rateTransaction,
  cancelOrder,
  getBuyerOrders,
  getSellerOrders,
  createPaymentIntent,
  confirmPayment
} = require('../controllers/orderController');
const {
  updatePaymentValidation,
  updateShippingAddressValidation,
  updateShippingValidation,
  rateTransactionValidation,
  cancelOrderValidation,
  paginationValidation
} = require('../validators/orderValidator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /orders/buyer:
 *   get:
 *     tags: [Orders]
 *     summary: Get buyer's orders
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
 *         description: Orders retrieved successfully
 */
router.get('/buyer', paginationValidation, validate, getBuyerOrders);

/**
 * @swagger
 * /orders/seller:
 *   get:
 *     tags: [Orders]
 *     summary: Get seller's orders
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
 *         description: Orders retrieved successfully
 */
router.get('/seller', paginationValidation, validate, getSellerOrders);

/**
 * @swagger
 * /orders/product/{productId}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by product ID
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
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/product/:productId', getOrderByProduct);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details retrieved
 */
router.get('/:orderId', getOrderDetails);

/**
 * @swagger
 * /orders/{orderId}/payment:
 *   put:
 *     tags: [Orders]
 *     summary: Update payment information (Buyer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - payment_method
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [momo, zalopay, vnpay, stripe, paypal, bank_transfer]
 *               payment_transaction_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated successfully
 */
router.put('/:orderId/payment', updatePaymentValidation, validate, updatePayment);

/**
 * @swagger
 * /orders/{orderId}/shipping-address:
 *   put:
 *     tags: [Orders]
 *     summary: Update shipping address (Buyer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - shipping_address
 *             properties:
 *               shipping_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping address updated successfully
 */
router.put('/:orderId/shipping-address', updateShippingAddressValidation, validate, updateShippingAddress);

/**
 * @swagger
 * /orders/{orderId}/shipping:
 *   put:
 *     tags: [Orders]
 *     summary: Update shipping info (Seller)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               tracking_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping info updated successfully
 */
router.put('/:orderId/shipping', updateShippingValidation, validate, updateShipping);

/**
 * @swagger
 * /orders/{orderId}/confirm-delivery:
 *   put:
 *     tags: [Orders]
 *     summary: Confirm delivery (Buyer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Delivery confirmed successfully
 */
router.put('/:orderId/confirm-delivery', confirmDelivery);

/**
 * @swagger
 * /orders/{orderId}/rate:
 *   post:
 *     tags: [Orders]
 *     summary: Rate transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 enum: [1, -1]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 */
router.post('/:orderId/rate', rateTransactionValidation, validate, rateTransaction);

/**
 * @swagger
 * /orders/{orderId}/cancel:
 *   put:
 *     tags: [Orders]
 *     summary: Cancel order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *         description: Order cancelled successfully
 */
router.put('/:orderId/cancel', cancelOrderValidation, validate, cancelOrder);

/**
 * @swagger
 * /orders/{orderId}/create-payment-intent:
 *   post:
 *     tags: [Orders]
 *     summary: Create Stripe payment intent
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 */
router.post('/:orderId/create-payment-intent', createPaymentIntent);

/**
 * @swagger
 * /orders/{orderId}/confirm-payment:
 *   post:
 *     tags: [Orders]
 *     summary: Confirm Stripe payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 */
router.post('/:orderId/confirm-payment', confirmPayment);

module.exports = router;
