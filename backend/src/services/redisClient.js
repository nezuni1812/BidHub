/**
 * Redis Client Configuration
 * Used for distributed locking and caching
 */

const Redis = require('ioredis');
const config = require('../config');

let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redisClient.on('connect', () => {
      console.log('✓ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('✗ Redis connection error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('⚠ Redis connection closed');
    });
  }

  return redisClient;
}

async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
}

module.exports = {
  getRedisClient,
  closeRedis
};
