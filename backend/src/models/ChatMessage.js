const db = require('../config/database');

class ChatMessage {
  /**
   * Send a message
   */
  static async create(orderId, senderId, receiverId, message) {
    const query = `
      INSERT INTO chat_messages (order_id, sender_id, receiver_id, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await db.query(query, [orderId, senderId, receiverId, message]);
    return result.rows[0];
  }

  /**
   * Get messages for an order
   */
  static async getByOrderId(orderId, page = 1, pageSize = 50) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT 
        cm.*,
        sender.full_name as sender_name,
        receiver.full_name as receiver_name
      FROM chat_messages cm
      JOIN users sender ON cm.sender_id = sender.id
      JOIN users receiver ON cm.receiver_id = receiver.id
      WHERE cm.order_id = $1
      ORDER BY cm.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `SELECT COUNT(*) FROM chat_messages WHERE order_id = $1`;
    
    const [messagesResult, countResult] = await Promise.all([
      db.query(query, [orderId, pageSize, offset]),
      db.query(countQuery, [orderId])
    ]);
    
    return {
      items: messagesResult.rows,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(pageSize),
        total: parseInt(countResult.rows[0].count),
        total_pages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize)
      }
    };
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(orderId, userId) {
    const query = `
      UPDATE chat_messages
      SET is_read = TRUE
      WHERE order_id = $1 AND receiver_id = $2 AND is_read = FALSE
      RETURNING *
    `;
    
    const result = await db.query(query, [orderId, userId]);
    return result.rows;
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    const query = `
      SELECT order_id, COUNT(*) as unread_count
      FROM chat_messages
      WHERE receiver_id = $1 AND is_read = FALSE
      GROUP BY order_id
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get user's conversations (list of orders with messages)
   */
  static async getUserConversations(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT DISTINCT ON (cm.order_id)
        cm.order_id,
        o.product_id,
        p.title as product_title,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) as product_image,
        CASE 
          WHEN o.buyer_id = $1 THEN o.seller_id
          ELSE o.buyer_id
        END as other_user_id,
        CASE 
          WHEN o.buyer_id = $1 THEN seller.full_name
          ELSE buyer.full_name
        END as other_user_name,
        cm.message as last_message,
        cm.created_at as last_message_time,
        (SELECT COUNT(*) FROM chat_messages WHERE order_id = cm.order_id AND receiver_id = $1 AND is_read = FALSE) as unread_count
      FROM chat_messages cm
      JOIN orders o ON cm.order_id = o.id
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE cm.sender_id = $1 OR cm.receiver_id = $1
      ORDER BY cm.order_id, cm.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [userId, pageSize, offset]);
    return result.rows;
  }
}

module.exports = ChatMessage;
