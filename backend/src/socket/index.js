/**
 * Socket.IO Server Initialization
 * 
 * ARCHITECTURE:
 * - Uses rooms for efficient broadcasting
 * - Each product has a room: `product-{id}`
 * - Each user has a personal room: `user-{id}`
 * - Authenticated connections only
 * 
 * ROOM STRUCTURE:
 * ┌─────────────────────────────────────┐
 * │  Product Room: product-123          │
 * │  ├─ User A (watching)               │
 * │  ├─ User B (watching)               │
 * │  └─ User C (watching)               │
 * │                                     │
 * │  When new bid → broadcast to all    │
 * └─────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────┐
 * │  Personal Room: user-456            │
 * │  └─ User B (all their devices)      │
 * │                                     │
 * │  For notifications: outbid, winner  │
 * └─────────────────────────────────────┘
 */

const { Server } = require('socket.io');
const socketAuth = require('./middleware/socketAuth');
const bidHandler = require('./handlers/bidHandler');
const EVENTS = require('./events');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Increase max listeners for high traffic
    maxHttpBufferSize: 1e6, // 1MB
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Apply authentication middleware
  io.use(socketAuth);

  // Connection handler
  io.on(EVENTS.CONNECT, (socket) => {
    console.log(`[SOCKET] User connected: ${socket.userId} (${socket.userName})`);

    // Attach handlers
    bidHandler(io, socket);

    // Handle disconnection
    socket.on(EVENTS.DISCONNECT, (reason) => {
      console.log(`[SOCKET] User disconnected: ${socket.userId} - Reason: ${reason}`);
    });

    // Handle errors
    socket.on(EVENTS.ERROR, (error) => {
      console.error(`[SOCKET] Socket error for user ${socket.userId}:`, error);
    });

    // Heartbeat for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  // Global error handler
  io.engine.on('connection_error', (err) => {
    console.error('[SOCKET] Connection error:', err);
  });

  console.log('✓ Socket.IO server initialized');

  return io;
}

module.exports = initSocket;
