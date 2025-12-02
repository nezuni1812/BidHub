const { body, param, query } = require('express-validator');

const updatePaymentValidation = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('payment_method')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['momo', 'zalopay', 'vnpay', 'stripe', 'paypal', 'bank_transfer']).withMessage('Invalid payment method'),
  body('payment_transaction_id')
    .optional()
    .isLength({ max: 255 }).withMessage('Transaction ID must not exceed 255 characters')
];

const updateShippingAddressValidation = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('shipping_address')
    .notEmpty().withMessage('Shipping address is required')
    .isLength({ min: 10, max: 500 }).withMessage('Shipping address must be between 10-500 characters')
];

const updateShippingValidation = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('tracking_number')
    .optional()
    .isLength({ max: 255 }).withMessage('Tracking number must not exceed 255 characters')
];

const rateTransactionValidation = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isIn([1, -1]).withMessage('Rating must be 1 or -1'),
  body('comment')
    .optional()
    .isLength({ max: 500 }).withMessage('Comment must not exceed 500 characters')
];

const cancelOrderValidation = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('page_size')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1-100')
];

module.exports = {
  updatePaymentValidation,
  updateShippingAddressValidation,
  updateShippingValidation,
  rateTransactionValidation,
  cancelOrderValidation,
  paginationValidation
};
