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
      INSERT INTO users (full_name, email, password_hash, address, date_of_birth, role)
      VALUES ($1, $2, $3, $4, $5, $6)
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
}

module.exports = User;
