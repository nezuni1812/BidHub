const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 50, // Increased from 20 to 50
  min: 2, // Minimum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Set client encoding to UTF-8
  client_encoding: 'UTF8',
});

pool.on('connect', (client) => {
  // Set encoding and timezone for each connection
  client.query("SET client_encoding TO 'UTF8'");
  client.query("SET timezone TO 'Asia/Ho_Chi_Minh'");
  console.log('✓ Database connected (GMT+7)');
});

pool.on('error', (err) => {
  console.error('✗ Unexpected database error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
