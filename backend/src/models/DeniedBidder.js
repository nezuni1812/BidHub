const db = require('../config/database');

class DeniedBidder {
  static async create(productId, userId, reason) {
    const query = `
      INSERT INTO denied_bidders (product_id, user_id, reason)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id, user_id) DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [productId, userId, reason]);
    return result.rows[0];
  }

  static async isDenied(productId, userId) {
    const query = `
      SELECT id FROM denied_bidders
      WHERE product_id = $1 AND user_id = $2
    `;
    const result = await db.query(query, [productId, userId]);
    return result.rows.length > 0;
  }

  static async getByProductId(productId) {
    const query = `
      SELECT 
        db.id,
        db.reason,
        db.created_at,
        u.id as user_id,
        u.full_name,
        u.email
      FROM denied_bidders db
      JOIN users u ON db.user_id = u.id
      WHERE db.product_id = $1
      ORDER BY db.created_at DESC
    `;
    const result = await db.query(query, [productId]);
    return result.rows;
  }

  static async remove(productId, userId) {
    const query = `
      DELETE FROM denied_bidders
      WHERE product_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [productId, userId]);
    return result.rows[0];
  }
}

module.exports = DeniedBidder;
