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
}

module.exports = UpgradeRequest;
