const { body, param, query } = require('express-validator');

const sendMessageValidation = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('message')
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1-2000 characters')
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
  sendMessageValidation,
  paginationValidation
};
