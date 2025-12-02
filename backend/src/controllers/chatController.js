const asyncHandler = require('../middleware/asyncHandler');
const { ForbiddenError, NotFoundError } = require('../utils/errors');
const ChatMessage = require('../models/ChatMessage');
const Order = require('../models/Order');

/**
 * @desc    Send a message
 * @route   POST /api/v1/chat/:orderId/messages
 * @access  Private (Buyer or Seller)
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

  // Check if order exists and user is involved
  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.buyer_id !== userId && order.seller_id !== userId) {
    throw new ForbiddenError('You are not part of this conversation');
  }

  // Determine receiver
  const receiverId = order.buyer_id === userId ? order.seller_id : order.buyer_id;

  // Create message
  const chatMessage = await ChatMessage.create(orderId, userId, receiverId, message);

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${receiverId}`).emit('new-message', {
      orderId,
      message: chatMessage,
      senderName: req.user.full_name
    });
  }

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: chatMessage
  });
});

/**
 * @desc    Get messages for an order
 * @route   GET /api/v1/chat/:orderId/messages
 * @access  Private (Buyer or Seller)
 */
const getMessages = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { page = 1, page_size = 50 } = req.query;
  const userId = req.user.id;

  // Check if order exists and user is involved
  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.buyer_id !== userId && order.seller_id !== userId) {
    throw new ForbiddenError('You are not part of this conversation');
  }

  // Get messages
  const result = await ChatMessage.getByOrderId(orderId, page, page_size);

  // Mark messages as read
  await ChatMessage.markAsRead(orderId, userId);

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  });
});

/**
 * @desc    Get user's conversations
 * @route   GET /api/v1/chat/conversations
 * @access  Private
 */
const getConversations = asyncHandler(async (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const userId = req.user.id;

  const conversations = await ChatMessage.getUserConversations(userId, page, page_size);

  res.json({
    success: true,
    data: conversations
  });
});

/**
 * @desc    Get unread count
 * @route   GET /api/v1/chat/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const unreadCounts = await ChatMessage.getUnreadCount(userId);

  const totalUnread = unreadCounts.reduce((sum, item) => sum + parseInt(item.unread_count), 0);

  res.json({
    success: true,
    data: {
      total: totalUnread,
      by_order: unreadCounts
    }
  });
});

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  getUnreadCount
};
