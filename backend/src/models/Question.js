const db = require('../config/database');

class Question {
  static async create(productId, userId, question) {
    const query = `
      INSERT INTO product_questions (product_id, user_id, question)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [productId, userId, question]);
    return result.rows[0];
  }

  static async getByProductId(productId) {
    const query = `
      SELECT 
        pq.id,
        pq.question,
        pq.answer,
        pq.created_at,
        pq.answered_at,
        u.full_name as asker_name
      FROM product_questions pq
      JOIN users u ON pq.user_id = u.id
      WHERE pq.product_id = $1
      ORDER BY pq.created_at DESC
    `;
    const result = await db.query(query, [productId]);
    return result.rows;
  }

  static async answer(questionId, answer) {
    const query = `
      UPDATE product_questions
      SET answer = $1, answered_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [answer, questionId]);
    return result.rows[0];
  }

  static async getById(questionId) {
    const query = `
      SELECT 
        pq.*,
        p.title as product_title,
        p.seller_id,
        u.full_name as asker_name,
        u.email as asker_email
      FROM product_questions pq
      JOIN products p ON pq.product_id = p.id
      JOIN users u ON pq.user_id = u.id
      WHERE pq.id = $1
    `;
    const result = await db.query(query, [questionId]);
    return result.rows[0];
  }
}

module.exports = Question;
