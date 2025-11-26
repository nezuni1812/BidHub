const db = require('../config/database');

class RefreshToken {
  static async create(userId, token, expiresAt) {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [userId, token, expiresAt]);
    return result.rows[0];
  }

  static async findByToken(token) {
    const query = `
      SELECT * FROM refresh_tokens
      WHERE token = $1 
        AND is_revoked = false
        AND expires_at > CURRENT_TIMESTAMP
    `;
    const result = await db.query(query, [token]);
    return result.rows[0];
  }

  static async revoke(token) {
    const query = `
      UPDATE refresh_tokens
      SET is_revoked = true, revoked_at = CURRENT_TIMESTAMP
      WHERE token = $1
      RETURNING *
    `;
    const result = await db.query(query, [token]);
    return result.rows[0];
  }

  static async revokeAllByUserId(userId) {
    const query = `
      UPDATE refresh_tokens
      SET is_revoked = true, revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_revoked = false
      RETURNING *
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async deleteExpired() {
    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = RefreshToken;
