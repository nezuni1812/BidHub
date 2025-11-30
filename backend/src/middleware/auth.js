const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const asyncHandler = require('./asyncHandler');

/**
 * Verify JWT access token from Authorization header
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError('Authentication failed');
  }
});

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  });
};

/**
 * Optional authentication - doesn't throw error if no token
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }
  
  next();
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
