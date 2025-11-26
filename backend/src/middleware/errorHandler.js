const { ApiError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errors } = err;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation Error';
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference';
  }

  // Default error
  statusCode = statusCode || 500;
  message = message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Log error
  if (statusCode >= 500) {
    console.error('ERROR:', err);
  }

  res.status(statusCode).json(response);
};

const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = { errorHandler, notFound };
