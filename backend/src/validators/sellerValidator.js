const { body, param, query } = require('express-validator');

exports.createProductValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 10, max: 255 }).withMessage('Title must be between 10 and 255 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
  
  body('category_id')
    .notEmpty().withMessage('Category is required')
    .isInt({ min: 1 }).withMessage('Invalid category'),
  
  body('start_price')
    .notEmpty().withMessage('Start price is required')
    .isFloat({ min: 1000 }).withMessage('Start price must be at least 1,000 VND'),
  
  body('buy_now_price')
    .optional()
    .isFloat({ min: 1000 }).withMessage('Buy now price must be at least 1,000 VND')
    .custom((value, { req }) => {
      if (value && req.body.start_price && parseFloat(value) <= parseFloat(req.body.start_price)) {
        throw new Error('Buy now price must be greater than start price');
      }
      return true;
    }),
  
  body('bid_step')
    .optional()
    .isFloat({ min: 1000 }).withMessage('Bid step must be at least 1,000 VND'),
  
  body('auto_extend')
    .optional()
    .isBoolean().withMessage('Auto extend must be boolean'),
  
  body('end_time')
    .notEmpty().withMessage('End time is required')
    .isISO8601().withMessage('Invalid end time format')
    .custom((value) => {
      const endTime = new Date(value);
      const now = new Date();
      const minEndTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      if (endTime <= now) {
        throw new Error('End time must be in the future');
      }
      if (endTime < minEndTime) {
        throw new Error('Auction must last at least 24 hours');
      }
      return true;
    })
  
  // NOTE: Image validation removed - now handled via multer middleware + controller
  // Images are uploaded as files via multipart/form-data, not JSON
  // Validation happens in:
  // 1. Multer middleware - file type, size (upload.js)
  // 2. Controller - minimum image count (sellerController.js)
];

exports.appendDescriptionValidation = [
  param('productId')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  
  body('additional_description')
    .trim()
    .notEmpty().withMessage('Additional description is required')
    .isLength({ min: 10 }).withMessage('Additional description must be at least 10 characters')
];

exports.denyBidderValidation = [
  param('productId')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  
  body('bidder_id')
    .notEmpty().withMessage('Bidder ID is required')
    .isInt({ min: 1 }).withMessage('Invalid bidder ID'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

exports.answerQuestionValidation = [
  param('questionId')
    .isInt({ min: 1 }).withMessage('Invalid question ID'),
  
  body('answer')
    .trim()
    .notEmpty().withMessage('Answer is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Answer must be between 10 and 2000 characters')
];

exports.rateWinnerValidation = [
  param('productId')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  
  body('score')
    .notEmpty().withMessage('Score is required')
    .isInt().withMessage('Score must be an integer')
    .isIn([1, -1]).withMessage('Score must be 1 (positive) or -1 (negative)'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Comment must not exceed 500 characters')
];

exports.cancelTransactionValidation = [
  param('productId')
    .isInt({ min: 1 }).withMessage('Invalid product ID')
];

exports.allowUnratedBidderValidation = [
  param('productId')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  
  param('bidderId')
    .isInt({ min: 1 }).withMessage('Invalid bidder ID')
];

exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('page_size')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100')
];
