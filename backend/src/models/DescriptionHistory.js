const db = require('../config/database');

class DescriptionHistory {
  static async create(productId, additionalDescription) {
    const query = `
      INSERT INTO product_description_history (product_id, additional_description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await db.query(query, [productId, additionalDescription]);
    return result.rows[0];
  }

  static async getByProductId(productId) {
    const query = `
      SELECT 
        id,
        product_id,
        additional_description,
        created_at
      FROM product_description_history
      WHERE product_id = $1
      ORDER BY created_at ASC
    `;
    const result = await db.query(query, [productId]);
    return result.rows;
  }
}

module.exports = DescriptionHistory;
