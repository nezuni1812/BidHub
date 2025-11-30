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

  // ================================================
  // ADMIN METHODS
  // ================================================

  static async findAllWithStats({ search, sort = 'name', limit = 20, offset = 0 }) {
    let query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.parent_id,
        c.created_at,
        c.updated_at,
        pc.name as parent_name,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_products,
        COUNT(DISTINCT CASE WHEN p.status = 'ended' THEN p.id END) as ended_products,
        COALESCE(SUM(CASE WHEN p.status = 'ended' AND p.current_price > p.starting_price THEN p.current_price END), 0) as total_revenue
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN products p ON c.id = p.category_id
    `;

    const params = [];
    if (search) {
      query += ` WHERE c.name ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY c.id, pc.name`;

    // Sort
    const validSorts = {
      'name': 'c.name',
      'created_at': 'c.created_at',
      'total_products': 'total_products',
      'total_revenue': 'total_revenue'
    };
    query += ` ORDER BY ${validSorts[sort] || 'c.name'} DESC`;

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findByIdWithStats(id) {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.parent_id,
        c.created_at,
        c.updated_at,
        pc.name as parent_name,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_products,
        COUNT(DISTINCT CASE WHEN p.status = 'ended' THEN p.id END) as ended_products,
        COALESCE(SUM(CASE WHEN p.status = 'ended' AND p.current_price > p.starting_price THEN p.current_price END), 0) as total_revenue
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.id = $1
      GROUP BY c.id, pc.name
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByName(name) {
    const query = 'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)';
    const result = await db.query(query, [name]);
    return result.rows[0];
  }

  static async count(search) {
    let query = 'SELECT COUNT(*) FROM categories';
    const params = [];
    
    if (search) {
      query += ' WHERE name ILIKE $1';
      params.push(`%${search}%`);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  static async getProductCount(categoryId) {
    const query = 'SELECT COUNT(*) FROM products WHERE category_id = $1';
    const result = await db.query(query, [categoryId]);
    return parseInt(result.rows[0].count);
  }

  static async getPerformanceStats(days = 30) {
    const query = `
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT CASE WHEN p.status = 'ended' AND p.end_time > NOW() - INTERVAL '${days} days' THEN p.id END) as products_ended,
        COUNT(DISTINCT b.id) FILTER (WHERE b.created_at > NOW() - INTERVAL '${days} days') as total_bids,
        COALESCE(SUM(CASE 
          WHEN p.status = 'ended' 
          AND p.end_time > NOW() - INTERVAL '${days} days'
          AND p.current_price > p.starting_price 
          THEN p.current_price 
        END), 0) as revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN bids b ON p.id = b.product_id
      GROUP BY c.id
      ORDER BY revenue DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = Category;
