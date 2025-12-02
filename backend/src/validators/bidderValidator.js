const { body, param, query } = require('express-validator');

const addToWatchlistValidation = [
  body('product_id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Invalid product ID')
];

const removeFromWatchlistValidation = [
  param('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Invalid product ID')
];

const askQuestionValidation = [
  body('product_id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('question')
    .notEmpty().withMessage('Question is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Question must be between 10-1000 characters')
];

const rateUserValidation = [
  body('rated_user_id')
    .notEmpty().withMessage('Rated user ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('product_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('score')
    .notEmpty().withMessage('Score is required')
    .isIn([1, -1]).withMessage('Score must be 1 or -1'),
  body('comment')
    .optional()
    .isLength({ max: 500 }).withMessage('Comment must not exceed 500 characters')
];

const updateProfileValidation = [
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2-255 characters'),
  body('address')
    .optional()
    .isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('date_of_birth')
    .optional()
    .isISO8601().withMessage('Invalid date format')
];

const changePasswordValidation = [
  body('old_password')
    .notEmpty().withMessage('Current password is required'),
  body('new_password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('page_size')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1-100')
];

const setAutoBidValidation = [
  body('product_id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('max_price')
    .notEmpty().withMessage('Max price is required')
    .isFloat({ min: 0 }).withMessage('Max price must be a positive number')
];

const cancelAutoBidValidation = [
  param('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Invalid product ID')
];

module.exports = {
  addToWatchlistValidation,
  removeFromWatchlistValidation,
  askQuestionValidation,
  rateUserValidation,
  updateProfileValidation,
  changePasswordValidation,
  paginationValidation,
  setAutoBidValidation,
  cancelAutoBidValidation
};
