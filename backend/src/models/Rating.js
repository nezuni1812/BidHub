const db = require('../config/database');

class Rating {
  static async create(raterId, ratedUserId, productId, score, comment) {
    const query = `
      INSERT INTO user_ratings (rater_id, rated_user_id, product_id, score, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [raterId, ratedUserId, productId, score, comment]);
    return result.rows[0];
  }

  static async getUserRatings(userId) {
    const query = `
      SELECT 
        ur.id,
        ur.score,
        ur.comment,
        ur.created_at,
        u.full_name as rater_name,
        p.title as product_title
      FROM user_ratings ur
      JOIN users u ON ur.rater_id = u.id
      LEFT JOIN products p ON ur.product_id = p.id
      WHERE ur.rated_user_id = $1
      ORDER BY ur.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async getUserRatingStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_ratings,
        COUNT(*) FILTER (WHERE score > 0) as positive_ratings,
        COUNT(*) FILTER (WHERE score < 0) as negative_ratings,
        ROUND(
          (COUNT(*) FILTER (WHERE score > 0)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as positive_percentage
      FROM user_ratings
      WHERE rated_user_id = $1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  static async canRate(raterId, ratedUserId, productId) {
    const query = `
      SELECT id FROM user_ratings
      WHERE rater_id = $1 AND rated_user_id = $2 AND product_id = $3
    `;
    const result = await db.query(query, [raterId, ratedUserId, productId]);
    return result.rows.length === 0;
  }
}

module.exports = Rating;
