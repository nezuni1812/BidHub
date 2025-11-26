const db = require('../config/database');

class Category {
  static async getAll() {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.parent_id,
        c.created_at,
        c.updated_at,
        pc.name as parent_name,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      ORDER BY 
        COALESCE(c.parent_id, c.id),
        c.id
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getTree() {
    const allCategories = await this.getAll();
    const parentCategories = allCategories.filter(c => !c.parent_id);
    
    return parentCategories.map(parent => ({
      ...parent,
      children: allCategories.filter(c => c.parent_id === parent.id)
    }));
  }

  static async getById(id) {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.parent_id,
        c.created_at,
        c.updated_at,
        pc.name as parent_name
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE c.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const query = `
      INSERT INTO categories (name, parent_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await db.query(query, [data.name, data.parent_id || null]);
    return result.rows[0];
  }

  static async update(id, data) {
    const query = `
      UPDATE categories
      SET name = $1, parent_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [data.name, data.parent_id || null, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM categories WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Category;
