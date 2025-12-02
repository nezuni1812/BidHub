const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getConversations,
  getUnreadCount
} = require('../controllers/chatController');
const {
  sendMessageValidation,
  paginationValidation
} = require('../validators/chatValidator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     tags: [Chat]
 *     summary: Get user's conversations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 */
router.get('/conversations', paginationValidation, validate, getConversations);

/**
 * @swagger
 * /chat/unread-count:
 *   get:
 *     tags: [Chat]
 *     summary: Get unread messages count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', getUnreadCount);

/**
 * @swagger
 * /chat/{orderId}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get messages for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/:orderId/messages', paginationValidation, validate, getMessages);

/**
 * @swagger
 * /chat/{orderId}/messages:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/:orderId/messages', sendMessageValidation, validate, sendMessage);

module.exports = router;
