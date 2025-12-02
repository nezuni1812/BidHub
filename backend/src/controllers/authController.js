const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const asyncHandler = require('../middleware/asyncHandler');
const { ConflictError, BadRequestError, UnauthorizedError } = require('../utils/errors');
const { generateOTP, getOTPExpirationTime } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/email');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const db = require('../config/database');
const passport = require('../config/passport');

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { full_name, email, password, address, date_of_birth } = req.body;
  
  // Check if user exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }
  
  // Create user
  const user = await User.create({
    full_name,
    email,
    password,
    address,
    date_of_birth,
    role: 'bidder'
  });
  
  // Generate OTP
  const otp = generateOTP();
  const otpExpires = getOTPExpirationTime();
  
  await User.updateOTP(user.id, otp, otpExpires);
  
  // Send OTP email
  try {
    await sendOTPEmail(email, otp, full_name);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
  }
  
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for OTP verification.',
    data: {
      user_id: user.id,
      email: user.email,
      otp_expires_in_minutes: getOTPExpirationTime()
    }
  });
});

/**
 * @desc    Verify OTP
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  
  const user = await User.verifyOTP(email, otp);
  
  if (!user) {
    throw new BadRequestError('Invalid or expired OTP');
  }
  
  // Activate user
  await User.activateUser(user.id);
  
  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  
  // Save refresh token to database
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create(user.id, refreshToken, expiresAt);
  
  res.json({
    success: true,
    message: 'Account verified successfully',
    data: {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    }
  });
});

/**
 * @desc    Resend OTP
 * @route   POST /api/v1/auth/resend-otp
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findByEmail(email);
  
  if (!user) {
    throw new BadRequestError('User not found');
  }
  
  if (user.is_active) {
    throw new BadRequestError('Account already verified');
  }
  
  // Generate new OTP
  const otp = generateOTP();
  const otpExpires = getOTPExpirationTime();
  
  await User.updateOTP(user.id, otp, otpExpires);
  
  // Send OTP email
  await sendOTPEmail(email, otp, user.full_name);
  
  res.json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      email: user.email
    }
  });
});

/**
 * @desc    Login
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findByEmail(email);
  
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  if (!user.is_active) {
    throw new UnauthorizedError('Account not verified. Please verify your email.');
  }
  
  // Debug logs
  console.log('=== LOGIN DEBUG ===');
  console.log('Email:', email);
  console.log('Password from request:', password);
  console.log('Password hash from DB:', user.password_hash);
  console.log('User ID:', user.id);
  
  const isPasswordValid = await User.comparePassword(password, user.password_hash);
  
  console.log('Password match result:', isPasswordValid);
  console.log('===================');
  
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  
  // Save refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create(user.id, refreshToken, expiresAt);
  
  res.json({
    success: true,
    data: {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        rating: user.rating
      }
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    throw new BadRequestError('Refresh token is required');
  }
  
  // Verify refresh token
  const decoded = verifyRefreshToken(refresh_token);
  if (!decoded) {
    throw new UnauthorizedError('Invalid refresh token');
  }
  
  // Check if token exists and not revoked
  const tokenRecord = await RefreshToken.findByToken(refresh_token);
  if (!tokenRecord) {
    throw new UnauthorizedError('Refresh token not found or expired');
  }
  
  // Get user info
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  if (!user.is_active) {
    throw new UnauthorizedError('Account is not active');
  }
  
  // Generate new access token
  const newAccessToken = generateAccessToken(user.id, user.role);
  
  res.json({
    success: true,
    data: {
      access_token: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    }
  });
});

/**
 * @desc    Logout (revoke refresh token)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    throw new BadRequestError('Refresh token is required');
  }
  
  // Revoke the token
  await RefreshToken.revoke(refresh_token);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
const logoutAll = asyncHandler(async (req, res) => {
  // Revoke all refresh tokens for this user
  await RefreshToken.revokeAllByUserId(req.user.id);
  
  res.json({
    success: true,
    message: 'Logged out from all devices'
  });
});

/**
 * @desc    Get current user info
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  res.json({
    success: true,
    data: user
  });
});

/**
 * @desc    Initiate Google OAuth
 * @route   GET /api/v1/auth/google
 * @access  Public
 */
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
});

/**
 * @desc    Google OAuth callback
 * @route   GET /api/v1/auth/google/callback
 * @access  Public
 */
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        console.error('Google auth error:', err);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=auth_failed`);
      }

      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=user_not_found`);
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Save refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await RefreshToken.create(user.id, refreshToken, expiresAt);

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/success?access_token=${accessToken}&refresh_token=${refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=callback_failed`);
    }
  })(req, res, next);
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  getMe,
  googleAuth,
  googleCallback
};
