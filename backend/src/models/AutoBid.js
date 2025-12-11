const db = require('../config/database');

class AutoBid {
  // Create or update auto-bid config
  static async createOrUpdate(userId, productId, maxPrice) {
    const query = `
      INSERT INTO auto_bid_configs (user_id, product_id, max_price, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (user_id, product_id) 
      DO UPDATE SET 
        max_price = EXCLUDED.max_price,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(query, [userId, productId, maxPrice]);
    return result.rows[0];
  }

  // Get active auto-bid for user on product
  static async getActive(userId, productId) {
    const query = `
      SELECT * FROM auto_bid_configs
      WHERE user_id = $1 AND product_id = $2 AND is_active = true
    `;
    const result = await db.query(query, [userId, productId]);
    return result.rows[0];
  }

  // Get max price history for user on product
  static async getMaxPriceHistory(userId, productId) {
    const query = `
      SELECT 
        max_price,
        created_at as set_at,
        updated_at as last_updated
      FROM auto_bid_configs
      WHERE user_id = $1 AND product_id = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [userId, productId]);
    return result.rows[0];
  }

  // Get all active auto-bids for a product (for auto-bidding logic)
  static async getAllActiveForProduct(productId) {
    const query = `
      SELECT abc.*, u.email, u.full_name
      FROM auto_bid_configs abc
      INNER JOIN users u ON abc.user_id = u.id
      WHERE abc.product_id = $1 AND abc.is_active = true
      ORDER BY abc.max_price DESC, abc.created_at ASC
    `;
    const result = await db.query(query, [productId]);
    return result.rows;
  }

  // Get user's active auto-bids
  static async getUserAutoBids(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT 
        abc.*,
        p.title,
        p.current_price,
        p.end_time,
        p.status,
        pi.url as image_url
      FROM auto_bid_configs abc
      INNER JOIN products p ON abc.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
      WHERE abc.user_id = $1 AND abc.is_active = true
      ORDER BY abc.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM auto_bid_configs
      WHERE user_id = $1 AND is_active = true
    `;
    
    const [dataResult, countResult] = await Promise.all([
      db.query(query, [userId, pageSize, offset]),
      db.query(countQuery, [userId])
    ]);
    
    return {
      items: dataResult.rows,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(pageSize),
        total_items: parseInt(countResult.rows[0].total),
        total_pages: Math.ceil(countResult.rows[0].total / pageSize)
      }
    };
  }

  // Deactivate auto-bid
  static async deactivate(userId, productId) {
    const query = `
      UPDATE auto_bid_configs
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [userId, productId]);
    return result.rows[0];
  }

  // Deactivate all auto-bids for a product (when auction ends)
  static async deactivateAllForProduct(productId) {
    const query = `
      UPDATE auto_bid_configs
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
    `;
    await db.query(query, [productId]);
  }
}

module.exports = AutoBid;
