const db = require('../config/database');

class Bid {
  static async create(productId, userId, bidPrice, isAuto = false) {
    const query = `
      INSERT INTO bids (product_id, user_id, bid_price, is_auto)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [productId, userId, bidPrice, isAuto]);
    return result.rows[0];
  }

  static async getByProductId(productId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT 
        b.id,
        b.bid_price,
        b.is_auto,
        b.created_at,
        CONCAT(LEFT(u.full_name, 1), REPEAT('*', LENGTH(u.full_name) - 1)) as bidder_name
      FROM bids b
      JOIN users u ON b.user_id = u.id
      WHERE b.product_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bids
      WHERE product_id = $1
    `;
    
    const [dataResult, countResult] = await Promise.all([
      db.query(query, [productId, pageSize, offset]),
      db.query(countQuery, [productId])
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

  static async getUserBiddingProducts(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT DISTINCT ON (p.id)
        p.id,
        p.id as product_id,
        p.title,
        p.current_price,
        p.buy_now_price,
        p.end_time,
        p.status,
        p.total_bids,
        EXTRACT(EPOCH FROM (p.end_time - NOW())) as seconds_remaining,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) as main_image,
        b.bid_price as my_bid_price,
        b.bid_price as my_last_bid,
        b.created_at as my_bid_time,
        CASE WHEN b.user_id = p.winner_id THEN true ELSE false END as is_winning
      FROM bids b
      JOIN products p ON b.product_id = p.id
      WHERE b.user_id = $1 AND p.status = 'active'
      ORDER BY p.id, b.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM bids b
      JOIN products p ON b.product_id = p.id
      WHERE b.user_id = $1 AND p.status = 'active'
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

  static async getUserWonProducts(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT 
        p.id,
        p.id as product_id,
        p.title,
        p.current_price as final_price,
        p.current_price as winning_price,
        p.end_time as won_date,
        p.end_time,
        p.status,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) as main_image,
        u.full_name as seller_name,
        u.email as seller_email,
        o.id as order_id,
        o.order_status as order_status,
        o.payment_status as payment_status,
        o.shipping_status as shipping_status
      FROM products p
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN orders o ON o.product_id = p.id AND o.buyer_id = $1
      WHERE p.winner_id = $1 AND p.status = 'completed'
      ORDER BY p.end_time DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products
      WHERE winner_id = $1 AND status = 'completed'
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

  static async getHighestBidForProduct(productId) {
    const query = `
      SELECT MAX(bid_price) as highest_bid
      FROM bids
      WHERE product_id = $1
    `;
    const result = await db.query(query, [productId]);
    return result.rows[0]?.highest_bid || null;
  }

  // ================================================
  // ADMIN METHODS
  // ================================================

  static async getTotalBids(days = 30) {
    const query = `
      SELECT COUNT(*) as count
      FROM bids
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Bid;
