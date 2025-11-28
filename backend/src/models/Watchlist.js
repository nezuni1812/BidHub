const db = require('../config/database');

class Watchlist {
  static async add(userId, productId) {
    const query = `
      INSERT INTO watchlists (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [userId, productId]);
    return result.rows[0];
  }

  static async remove(userId, productId) {
    const query = `
      DELETE FROM watchlists
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [userId, productId]);
    return result.rows[0];
  }

  static async getByUserId(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT 
        w.id,
        w.created_at,
        p.id as product_id,
        p.title,
        p.current_price,
        p.buy_now_price,
        p.end_time,
        p.status,
        p.total_bids,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) as main_image,
        c.name as category_name,
        u.full_name as seller_name
      FROM watchlists w
      JOIN products p ON w.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM watchlists
      WHERE user_id = $1
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

  static async exists(userId, productId) {
    const query = `
      SELECT id FROM watchlists
      WHERE user_id = $1 AND product_id = $2
    `;
    const result = await db.query(query, [userId, productId]);
    return result.rows.length > 0;
  }
}

module.exports = Watchlist;
