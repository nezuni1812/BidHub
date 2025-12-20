/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token before allowing socket connection
 * 
 * FLOW:
 * 1. Client connects with token in auth.token
 * 2. Verify JWT token
 * 3. If valid → attach user info to socket & allow connection
 * 4. If invalid → reject connection
 */

const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../../models/User');

async function socketAuth(socket, next) {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    console.log('[SOCKET AUTH] Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    console.log('[SOCKET AUTH] Token decoded:', decoded);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    console.log('[SOCKET AUTH] User found:', user ? user.id : 'No');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    if (!user.is_active) {
      return next(new Error('User account is inactive'));
    }

    // Attach user info to socket
    socket.userId = user.id;
    socket.userRole = user.role;
    socket.userName = user.full_name;
    socket.userEmail = user.email;

    // Join user's personal room for notifications
    socket.join(`user-${user.id}`);
    
    console.log('[SOCKET AUTH] Success: User', user.id, 'authenticated and joined room: user-' + user.id);
    console.log('[SOCKET AUTH] User rooms:', Array.from(socket.rooms));

    next();
  } catch (error) {
    console.error('[SOCKET AUTH] Error:', error.message, error.name);
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication token expired'));
    }
    return next(new Error('Authentication failed'));
  }
}

module.exports = socketAuth;
