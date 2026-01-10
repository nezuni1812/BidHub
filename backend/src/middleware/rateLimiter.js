const rateLimit = require('express-rate-limit');

// ================================================
// 1. GENERAL API RATE LIMITER - 100 requests per 15 minutes
// ================================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Store in memory (can use Redis for production)
});

// ================================================
// 2. AUTH RATE LIMITER - Stricter for login/register
// ================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================
// 3. PASSWORD RESET LIMITER - Prevent abuse
// ================================================
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 password reset requests per hour
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================
// 4. BID PLACEMENT LIMITER - Prevent spam bidding
// ================================================
const bidLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 bids per minute per IP
  message: {
    success: false,
    message: 'Bạn đang đấu giá quá nhanh, vui lòng đợi 1 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================
// 5. PRODUCT CREATION LIMITER - Prevent spam
// ================================================
const createProductLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 products per hour
  message: {
    success: false,
    message: 'Bạn đã tạo quá nhiều sản phẩm, vui lòng thử lại sau 1 giờ'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================
// 6. MESSAGE/COMMENT LIMITER - Prevent spam
// ================================================
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Max 20 messages per minute
  message: {
    success: false,
    message: 'Bạn đang gửi tin nhắn quá nhanh, vui lòng đợi 1 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================
// 7. FILE UPLOAD LIMITER - Prevent abuse
// ================================================
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 file uploads per 15 minutes
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu tải file, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================
// 8. SEARCH/BROWSE LIMITER - Lighter restrictions
// ================================================
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 search requests per minute
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu tìm kiếm, vui lòng đợi 1 phút'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================
// 9. ADMIN API LIMITER - Higher limits
// ================================================
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin operations
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu admin, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  bidLimiter,
  createProductLimiter,
  messageLimiter,
  uploadLimiter,
  searchLimiter,
  adminLimiter,
};
