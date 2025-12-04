const db = require('../config/database');

class UpgradeRequest {
  static async create(userId) {
    const query = `
      INSERT INTO upgrade_requests (user_id, status)
      VALUES ($1, 'pending')
      RETURNING *
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  static async getByUserId(userId) {
    const query = `
      SELECT * FROM upgrade_requests
      WHERE user_id = $1
      ORDER BY requested_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  static async getPending(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    
    const query = `
      SELECT 
        ur.*,
        u.full_name,
        u.email,
        u.rating
      FROM upgrade_requests ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.status = 'pending'
      ORDER BY ur.requested_at ASC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM upgrade_requests
      WHERE status = 'pending'
    `;
    
    const [dataResult, countResult] = await Promise.all([
      db.query(query, [pageSize, offset]),
      db.query(countQuery)
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

  static async approve(requestId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get user_id from request
      const requestQuery = `
        SELECT user_id FROM upgrade_requests
        WHERE id = $1
      `;
      const requestResult = await client.query(requestQuery, [requestId]);
      const userId = requestResult.rows[0]?.user_id;
      
      if (!userId) {
        throw new Error('Request not found');
      }
      
      // Update request status
      const updateRequestQuery = `
        UPDATE upgrade_requests
        SET status = 'approved', processed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      await client.query(updateRequestQuery, [requestId]);
      
      // Upgrade user to seller
      const upgradeUserQuery = `
        UPDATE users
        SET role = 'seller', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const userResult = await client.query(upgradeUserQuery, [userId]);
      
      await client.query('COMMIT');
      return userResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async reject(requestId) {
    const query = `
      UPDATE upgrade_requests
      SET status = 'rejected', processed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [requestId]);
    return result.rows[0];
  }

  static async hasPendingRequest(userId) {
    const query = `
      SELECT id FROM upgrade_requests
      WHERE user_id = $1 AND status = 'pending'
    `;
    const result = await db.query(query, [userId]);
    return result.rows.length > 0;
  }

  // ================================================
  // ADMIN METHODS
  // ================================================

  static async findAll({ status = 'pending', sort = 'requested_at', order = 'DESC', limit = 20, offset = 0 }) {
    const query = `
      SELECT 
        ur.id,
        ur.user_id,
        ur.status,
        ur.requested_at,
        ur.processed_at,
        ur.admin_note,
        u.full_name,
        u.email,
        u.rating,
        u.created_at as user_created_at,
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT p.id) FILTER (WHERE p.winner_id = u.id) as auctions_won
      FROM upgrade_requests ur
      INNER JOIN users u ON ur.user_id = u.id
      LEFT JOIN bids b ON u.id = b.user_id
      LEFT JOIN products p ON p.winner_id = u.id
      WHERE ur.status = $1
      GROUP BY ur.id, u.id
      ORDER BY ur.${sort} ${order}
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [status, limit, offset]);
    return result.rows;
  }

  static async count(status = 'pending') {
    const query = `
      SELECT COUNT(*) 
      FROM upgrade_requests 
      WHERE status = $1
    `;
    const result = await db.query(query, [status]);
    return parseInt(result.rows[0].count);
  }

  static async findById(id) {
    const query = `
      SELECT 
        ur.*,
        u.full_name,
        u.email,
        u.rating,
        u.address,
        u.date_of_birth,
        u.created_at as user_created_at,
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT p.id) FILTER (WHERE p.winner_id = u.id) as auctions_won,
        COALESCE(SUM(CASE WHEN p.winner_id = u.id THEN p.current_price END), 0) as total_spent
      FROM upgrade_requests ur
      INNER JOIN users u ON ur.user_id = u.id
      LEFT JOIN bids b ON u.id = b.user_id
      LEFT JOIN products p ON p.winner_id = u.id
      WHERE ur.id = $1
      GROUP BY ur.id, u.id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status, adminId, reason = null) {
    const query = `
      UPDATE upgrade_requests
      SET 
        status = $1, 
        processed_at = CURRENT_TIMESTAMP,
        admin_note = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [status, reason, id]);
    return result.rows[0];
  }

  static async countApprovedByPeriod(days = 30) {
    const query = `
      SELECT COUNT(*) as count
      FROM upgrade_requests
      WHERE status = 'approved'
      AND processed_at > NOW() - INTERVAL '${days} days'
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = UpgradeRequest;
