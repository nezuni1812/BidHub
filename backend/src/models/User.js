const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        id, role, full_name, email, address, date_of_birth, 
        rating, is_active, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const query = `
      INSERT INTO users (full_name, email, password_hash, address, date_of_birth, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING id, full_name, email, role, created_at
    `;
    const result = await db.query(query, [
      data.full_name,
      data.email,
      hashedPassword,
      data.address || null,
      data.date_of_birth || null,
      data.role || 'bidder'
    ]);
    return result.rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateOTP(userId, otpCode, expiresAt) {
    const query = `
      UPDATE users 
      SET otp_code = $1, otp_expired_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id
    `;
    const result = await db.query(query, [otpCode, expiresAt, userId]);
    return result.rows[0];
  }

  static async verifyOTP(email, otpCode) {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 
        AND otp_code = $2 
        AND otp_expired_at > CURRENT_TIMESTAMP
    `;
    const result = await db.query(query, [email, otpCode]);
    return result.rows[0];
  }

  static async activateUser(userId) {
    const query = `
      UPDATE users 
      SET is_active = true, otp_code = NULL, otp_expired_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, is_active
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  static async updateProfile(userId, data) {
    const query = `
      UPDATE users 
      SET full_name = $1, address = $2, date_of_birth = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, full_name, email, address, date_of_birth, role, rating
    `;
    const result = await db.query(query, [
      data.full_name,
      data.address,
      data.date_of_birth,
      userId
    ]);
    return result.rows[0];
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await db.query(query, [hashedPassword, userId]);
  }

  // ================================================
  // ADMIN METHODS
  // ================================================

  static async findAllAdmin({ role, is_active, search, sort = 'created_at', order = 'DESC', limit = 20, offset = 0 }) {
    let query = `
      SELECT 
        id,
        role,
        full_name,
        email,
        address,
        date_of_birth,
        rating,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sort
    const validSorts = {
      'created_at': 'created_at',
      'full_name': 'full_name',
      'email': 'email',
      'rating': 'rating'
    };
    query += ` ORDER BY ${validSorts[sort] || 'created_at'} ${order}`;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async countAdmin({ role, is_active, search }) {
    let query = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  static async findByIdAdmin(id) {
    const query = `
      SELECT 
        u.*,
        COUNT(DISTINCT CASE WHEN u.role = 'seller' THEN p.id END) as total_products,
        COUNT(DISTINCT CASE WHEN u.role = 'bidder' THEN b.id END) as total_bids,
        COUNT(DISTINCT CASE WHEN u.role = 'bidder' THEN w.id END) as watchlist_count
      FROM users u
      LEFT JOIN products p ON u.id = p.seller_id
      LEFT JOIN bids b ON u.id = b.user_id
      LEFT JOIN watchlist w ON u.id = w.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const user = result.rows[0];
    delete user.password_hash; // Don't expose password hash
    return user;
  }

  static async updateAdmin(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (data.full_name !== undefined) {
      fields.push(`full_name = $${paramIndex}`);
      params.push(data.full_name);
      paramIndex++;
    }

    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      params.push(data.email);
      paramIndex++;
    }

    if (data.role !== undefined) {
      fields.push(`role = $${paramIndex}`);
      params.push(data.role);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
      paramIndex++;
    }

    if (data.address !== undefined) {
      fields.push(`address = $${paramIndex}`);
      params.push(data.address);
      paramIndex++;
    }

    if (data.date_of_birth !== undefined) {
      fields.push(`date_of_birth = $${paramIndex}`);
      params.push(data.date_of_birth);
      paramIndex++;
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, role, full_name, email, address, date_of_birth, rating, is_active, created_at, updated_at
    `;

    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updateRole(userId, newRole) {
    const query = `
      UPDATE users
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, role, full_name, email
    `;
    const result = await db.query(query, [newRole, userId]);
    return result.rows[0];
  }

  static async updateRoleWithExpiration(userId, newRole, expiresAt) {
    const query = `
      UPDATE users
      SET role = $1, seller_until = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, role, full_name, email, seller_until
    `;
    const result = await db.query(query, [newRole, expiresAt, userId]);
    return result.rows[0];
  }

  static async countByRole() {
    const query = `
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `;
    const result = await db.query(query);
    
    const stats = {
      admin: 0,
      seller: 0,
      bidder: 0
    };

    result.rows.forEach(row => {
      stats[row.role] = parseInt(row.count);
    });

    return stats;
  }

  static async countByPeriod(days = 30) {
    const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }

  static async getStatsByInterval(days = 30, interval = 'day') {
    const intervalFormat = {
      'day': 'YYYY-MM-DD',
      'week': 'IYYY-IW',
      'month': 'YYYY-MM'
    }[interval] || 'YYYY-MM-DD';

    const query = `
      SELECT 
        TO_CHAR(created_at, '${intervalFormat}') as period,
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'bidder' THEN 1 END) as bidders,
        COUNT(CASE WHEN role = 'seller' THEN 1 END) as sellers
      FROM users
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY period
      ORDER BY period
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getTopSellers(days = 30, limit = 10) {
    const query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.rating,
        COUNT(DISTINCT p.id) as total_auctions,
        COALESCE(SUM(CASE 
          WHEN p.status = 'ended' 
          AND p.end_time > NOW() - INTERVAL '${days} days'
          AND p.current_price > p.starting_price 
          THEN p.current_price 
        END), 0) as total_revenue
      FROM users u
      INNER JOIN products p ON u.id = p.seller_id
      WHERE u.role = 'seller'
      GROUP BY u.id
      ORDER BY total_revenue DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }

  static async getTopBidders(days = 30, limit = 10) {
    const query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.rating,
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT p.id) FILTER (WHERE p.winner_id = u.id AND p.end_time > NOW() - INTERVAL '${days} days') as auctions_won,
        COALESCE(SUM(CASE 
          WHEN p.winner_id = u.id 
          AND p.end_time > NOW() - INTERVAL '${days} days'
          THEN p.current_price 
        END), 0) as total_spent
      FROM users u
      INNER JOIN bids b ON u.id = b.user_id AND b.created_at > NOW() - INTERVAL '${days} days'
      LEFT JOIN products p ON p.winner_id = u.id
      WHERE u.role = 'bidder'
      GROUP BY u.id
      ORDER BY total_bids DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }
}

module.exports = User;
