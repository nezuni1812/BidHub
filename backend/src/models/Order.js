const db = require('../config/database');

class Order {
  /**
   * Create new order after auction ends
   */
  static async create(productId, buyerId, sellerId, totalPrice) {
    const query = `
      INSERT INTO orders (
        product_id, buyer_id, seller_id, total_price,
        order_status, payment_status, shipping_status
      )
      VALUES ($1, $2, $3, $4, 'pending_payment', 'pending', 'pending')
      RETURNING *
    `;
    
    const result = await db.query(query, [productId, buyerId, sellerId, totalPrice]);
    return result.rows[0];
  }

  /**
   * Get order by ID
   */
  static async getById(orderId) {
    const query = `
      SELECT 
        o.*,
        p.title as product_title,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) as product_image,
        buyer.full_name as buyer_name,
        buyer.email as buyer_email,
        seller.full_name as seller_name,
        seller.email as seller_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.id = $1
    `;
    
    const result = await db.query(query, [orderId]);
    return result.rows[0];
  }

  /**
   * Get order by product ID
   */
  static async getByProductId(productId) {
    const query = `
      SELECT 
        o.*,
        p.title as product_title,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) as product_image,
        buyer.full_name as buyer_name,
        buyer.email as buyer_email,
        seller.full_name as seller_name,
        seller.email as seller_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.product_id = $1
    `;
    
    const result = await db.query(query, [productId]);
    return result.rows[0];
  }

  /**
   * Update payment info
   */
  static async updatePayment(orderId, data) {
    const query = `
      UPDATE orders
      SET 
        payment_method = $1,
        payment_status = $2,
        payment_transaction_id = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [
      data.payment_method,
      data.payment_status,
      data.payment_transaction_id,
      orderId
    ]);
    return result.rows[0];
  }

  /**
   * Update shipping address
   */
  static async updateShippingAddress(orderId, shippingAddress) {
    const query = `
      UPDATE orders
      SET 
        shipping_address = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [shippingAddress, orderId]);
    return result.rows[0];
  }

  /**
   * Update shipping info (seller confirms)
   */
  static async updateShipping(orderId, data) {
    const query = `
      UPDATE orders
      SET 
        shipping_status = $1,
        tracking_number = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [
      data.shipping_status,
      data.tracking_number,
      orderId
    ]);
    return result.rows[0];
  }

  /**
   * Buyer confirms received
   */
  static async confirmDelivery(orderId) {
    const query = `
      UPDATE orders
      SET 
        shipping_status = 'delivered',
        order_status = 'delivered',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [orderId]);
    return result.rows[0];
  }

  /**
   * Rate transaction (buyer rates seller or seller rates buyer)
   */
  static async rateTransaction(orderId, userId, rating, comment, isBuyer) {
    let query;
    
    if (isBuyer) {
      // Buyer rating seller
      query = `
        UPDATE orders
        SET 
          buyer_rating = $1,
          buyer_comment = $2,
          buyer_rated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND buyer_id = $4
        RETURNING *
      `;
    } else {
      // Seller rating buyer
      query = `
        UPDATE orders
        SET 
          seller_rating = $1,
          seller_comment = $2,
          seller_rated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND seller_id = $4
        RETURNING *
      `;
    }
    
    const result = await db.query(query, [rating, comment, orderId, userId]);
    
    // Check if both rated, then complete order
    if (result.rows[0]) {
      const order = result.rows[0];
      if (order.buyer_rating !== null && order.seller_rating !== null) {
        await db.query(
          `UPDATE orders SET order_status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [orderId]
        );
      }
    }
    
    return result.rows[0];
  }

  /**
   * Cancel order
   */
  static async cancel(orderId, userId, reason) {
    const query = `
      UPDATE orders
      SET 
        order_status = 'cancelled',
        cancelled_by = $1,
        cancel_reason = $2,
        cancelled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, reason, orderId]);
    return result.rows[0];
  }

  /**
   * Get user's orders as buyer
   */
  static async getBuyerOrders(buyerId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT 
        o.*,
        p.title as product_title,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) as product_image,
        seller.full_name as seller_name,
        seller.username as seller_username
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `SELECT COUNT(*) FROM orders WHERE buyer_id = $1`;
    
    const [ordersResult, countResult] = await Promise.all([
      db.query(query, [buyerId, pageSize, offset]),
      db.query(countQuery, [buyerId])
    ]);
    
    return {
      items: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(pageSize),
        total: parseInt(countResult.rows[0].count),
        total_pages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize)
      }
    };
  }

  /**
   * Get user's orders as seller
   */
  static async getSellerOrders(sellerId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT 
        o.*,
        p.title as product_title,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) as product_image,
        buyer.full_name as buyer_name,
        buyer.username as buyer_username
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      WHERE o.seller_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `SELECT COUNT(*) FROM orders WHERE seller_id = $1`;
    
    const [ordersResult, countResult] = await Promise.all([
      db.query(query, [sellerId, pageSize, offset]),
      db.query(countQuery, [sellerId])
    ]);
    
    return {
      items: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(pageSize),
        total: parseInt(countResult.rows[0].count),
        total_pages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize)
      }
    };
  }

  /**
   * Update order status
   */
  static async updateStatus(orderId, status) {
    const query = `
      UPDATE orders
      SET 
        order_status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [status, orderId]);
    return result.rows[0];
  }
}

module.exports = Order;
