/**
 * Distributed Lock Service using Redis
 * Prevents race conditions in concurrent bidding
 * 
 * USE CASE:
 * 1. Multiple users bid on same product simultaneously
 * 2. Lock ensures only one bid is processed at a time
 * 3. Other bids wait or fail gracefully
 */

const { getRedisClient } = require('./redisClient');

/**
 * Acquire a distributed lock
 * @param {string} key - Lock key (e.g., 'bid-lock:product-123')
 * @param {number} ttl - Time to live in milliseconds (default 5000ms)
 * @returns {Object|null} Lock object or null if failed
 * 
 * FLOW:
 * 1. Generate unique lock value (timestamp + random)
 * 2. Try to SET key with NX (only if not exists) and PX (expiry)
 * 3. If success → return lock object
 * 4. If fail → another process holds the lock
 */
async function acquireLock(key, ttl = 5000) {
  const redis = getRedisClient();
  const lockValue = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // SET key value PX milliseconds NX
    // NX: Only set if key doesn't exist
    // PX: Set expiry in milliseconds
    const result = await redis.set(key, lockValue, 'PX', ttl, 'NX');
    
    if (result === 'OK') {
      return {
        key,
        value: lockValue,
        ttl
      };
    }
    
    return null; // Lock already held by another process
  } catch (error) {
    console.error('Lock acquisition error:', error);
    return null;
  }
}

/**
 * Release a distributed lock
 * @param {Object} lock - Lock object from acquireLock
 * @returns {boolean} True if released, false otherwise
 * 
 * FLOW:
 * 1. Verify lock value matches (prevent releasing others' locks)
 * 2. Delete key atomically using Lua script
 * 3. Return success status
 */
async function releaseLock(lock) {
  if (!lock || !lock.key || !lock.value) {
    return false;
  }

  const redis = getRedisClient();
  
  try {
    // Lua script for atomic check-and-delete
    // Only delete if the value matches (we own this lock)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await redis.eval(script, 1, lock.key, lock.value);
    return result === 1;
  } catch (error) {
    console.error('Lock release error:', error);
    return false;
  }
}

/**
 * Try to acquire lock with retry
 * @param {string} key - Lock key
 * @param {number} ttl - Lock TTL
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} retryDelay - Delay between retries in ms
 * @returns {Object|null} Lock object or null
 * 
 * USE CASE: When we want to wait for lock instead of failing immediately
 */
async function acquireLockWithRetry(key, ttl = 5000, maxRetries = 3, retryDelay = 100) {
  for (let i = 0; i < maxRetries; i++) {
    const lock = await acquireLock(key, ttl);
    
    if (lock) {
      return lock;
    }
    
    // Wait before retry (except on last attempt)
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return null;
}

/**
 * Check if a lock exists
 * @param {string} key - Lock key
 * @returns {boolean} True if lock exists
 */
async function isLocked(key) {
  const redis = getRedisClient();
  
  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Lock check error:', error);
    return false;
  }
}

/**
 * Extend lock TTL (for long-running operations)
 * @param {Object} lock - Lock object
 * @param {number} additionalTtl - Additional TTL in milliseconds
 * @returns {boolean} True if extended
 */
async function extendLock(lock, additionalTtl) {
  if (!lock || !lock.key || !lock.value) {
    return false;
  }

  const redis = getRedisClient();
  
  try {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    
    const result = await redis.eval(script, 1, lock.key, lock.value, additionalTtl);
    return result === 1;
  } catch (error) {
    console.error('Lock extend error:', error);
    return false;
  }
}

module.exports = {
  acquireLock,
  releaseLock,
  acquireLockWithRetry,
  isLocked,
  extendLock
};
