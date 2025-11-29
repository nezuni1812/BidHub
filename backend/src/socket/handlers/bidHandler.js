/**
 * Real-time Bidding Handler with Redis Distributed Locking
 * 
 * USE CASE: Multiple users bidding on same product simultaneously
 * 
 * PROBLEM WITHOUT LOCKING:
 * User A sees price: 1,000,000 → bids 1,100,000
 * User B sees price: 1,000,000 → bids 1,050,000 (lower!)
 * Both submit at exact same time → Race condition!
 * Result: Invalid bid accepted OR data corruption
 * 
 * SOLUTION WITH REDIS LOCK:
 * User A acquires lock → processes bid → releases lock → User B gets lock
 * User B sees updated price: 1,100,000 → bid rejected (too low)
 * Result: Data consistency guaranteed!
 * 
 * FLOW DIAGRAM:
 * ┌─────────┐         ┌─────────┐         ┌─────────┐
 * │ User A  │         │  Redis  │         │ User B  │
 * └────┬────┘         └────┬────┘         └────┬────┘
 *      │                   │                   │
 *      │ place-bid         │                   │ place-bid
 *      ├──────────────────>│<──────────────────┤
 *      │                   │                   │
 *      │ acquire lock ✓    │                   │
 *      │<──────────────────┤                   │
 *      │                   │  acquire lock ✗   │
 *      │                   ├──────────────────>│
 *      │                   │   (wait/retry)    │
 *      │                   │                   │
 *      │ process bid       │                   │
 *      │ update DB         │                   │
 *      │ broadcast         │                   │
 *      │                   │                   │
 *      │ release lock      │                   │
 *      ├──────────────────>│                   │
 *      │                   │                   │
 *      │                   │  acquire lock ✓   │
 *      │                   ├──────────────────>│
 *      │                   │                   │
 *      │                   │   process bid     │
 *      │                   │   (sees new price)│
 *      │                   │                   │
 *      │<──────broadcast───┼───────────────────│
 *      │                   │                   │
 */

const Bid = require('../../models/Bid');
const Product = require('../../models/Product');
const DeniedBidder = require('../../models/DeniedBidder');
const Rating = require('../../models/Rating');
const { acquireLockWithRetry, releaseLock } = require('../../services/lockService');
const db = require('../../config/database');
const EVENTS = require('../events');

module.exports = (io, socket) => {
  /**
   * Handle: place-bid event
   * 
   * CLIENT SENDS:
   * {
   *   productId: 123,
   *   bidPrice: 1500000
   * }
   * 
   * SERVER RESPONDS:
   * Success: emit('bid-success', { bid, product })
   * Error: emit('bid-error', { message })
   * 
   * BROADCASTS TO ROOM:
   * emit('new-bid', { productId, currentPrice, totalBids, bidder, timestamp })
   */
  socket.on(EVENTS.PLACE_BID, async (data) => {
    const { productId, bidPrice } = data;
    const userId = socket.userId;
    const lockKey = `bid-lock:product-${productId}`;
    let lock = null;

    try {
      console.log(`[BID] User ${userId} attempting bid ${bidPrice} on product ${productId}`);

      // STEP 1: Acquire distributed lock (max 3 retries, 100ms delay)
      // This ensures only ONE bid is processed at a time for this product
      lock = await acquireLockWithRetry(lockKey, 5000, 3, 100);
      
      if (!lock) {
        console.log(`[BID] Lock acquisition failed for product ${productId}`);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: 'Có nhiều người đang đấu giá, vui lòng thử lại sau 1 giây',
          code: 'LOCK_FAILED'
        });
      }

      console.log(`[BID] Lock acquired: ${lock.key}`);

      // STEP 2: Get product details (FRESH data after lock acquired)
      const product = await Product.getById(productId);
      
      if (!product) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: 'Sản phẩm không tồn tại',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // STEP 3: Validate auction status
      if (product.status !== 'active') {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: 'Phiên đấu giá đã kết thúc hoặc bị hủy',
          code: 'AUCTION_NOT_ACTIVE'
        });
      }

      const now = new Date();
      if (new Date(product.end_time) <= now) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: 'Phiên đấu giá đã kết thúc',
          code: 'AUCTION_ENDED'
        });
      }

      // STEP 4: Check if user is the seller
      if (product.seller_id === userId) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: 'Người bán không thể đấu giá sản phẩm của mình',
          code: 'SELLER_CANNOT_BID'
        });
      }

      // STEP 5: Check if user is denied
      const isDenied = await DeniedBidder.isDenied(productId, userId);
      if (isDenied) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: 'Bạn đã bị từ chối đấu giá sản phẩm này',
          code: 'BIDDER_DENIED'
        });
      }

      // STEP 6: Check user rating (80% positive rating requirement)
      const ratingStats = await Rating.getUserRatingStats(userId);
      const totalRatings = parseInt(ratingStats.total_ratings) || 0;
      const positivePercentage = parseFloat(ratingStats.positive_percentage) || 0;

      if (totalRatings > 0 && positivePercentage < 80) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: 'Bạn cần có tối thiểu 80% đánh giá tích cực để đấu giá',
          code: 'RATING_TOO_LOW',
          rating: positivePercentage
        });
      }

      // For unrated users, check system setting
      if (totalRatings === 0) {
        const settingResult = await db.query(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'allow_unrated_bidders'"
        );
        const allowUnrated = settingResult.rows[0]?.setting_value === 'true';
        
        if (!allowUnrated) {
          await releaseLock(lock);
          return socket.emit(EVENTS.BID_ERROR, { 
            message: 'Bạn cần có đánh giá trước khi đấu giá',
            code: 'NO_RATINGS'
          });
        }
      }

      // STEP 7: Validate bid price (CRITICAL: use FRESH product data)
      const minValidBid = parseFloat(product.current_price) + parseFloat(product.bid_step);
      
      if (bidPrice < minValidBid) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: `Giá đặt tối thiểu phải là ${minValidBid.toLocaleString('vi-VN')} VND`,
          code: 'BID_TOO_LOW',
          minBid: minValidBid,
          currentPrice: product.current_price
        });
      }

      // STEP 8: Create bid in database
      const bid = await Bid.create(productId, userId, bidPrice, false);
      console.log(`[BID] Bid created: ${bid.id}`);

      // STEP 9: Update product (current_price, total_bids, winner_id)
      await db.query(
        `UPDATE products 
         SET current_price = $1, 
             total_bids = total_bids + 1,
             winner_id = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [bidPrice, userId, productId]
      );

      // STEP 10: Get previous highest bidder
      const previousBidResult = await db.query(
        `SELECT user_id FROM bids 
         WHERE product_id = $1 AND user_id != $2
         ORDER BY bid_price DESC, created_at ASC
         LIMIT 1`,
        [productId, userId]
      );
      const previousBidderId = previousBidResult.rows[0]?.user_id;

      // STEP 11: Check auto-extend (if bid placed within 5 minutes of end time)
      const timeLeft = new Date(product.end_time) - now;
      const autoExtendThreshold = 5 * 60 * 1000; // 5 minutes
      const autoExtendDuration = 10 * 60 * 1000; // 10 minutes
      let wasExtended = false;

      if (product.auto_extend && timeLeft < autoExtendThreshold) {
        const newEndTime = new Date(Date.now() + autoExtendDuration);
        await db.query(
          'UPDATE products SET end_time = $1 WHERE id = $2',
          [newEndTime, productId]
        );
        wasExtended = true;
        
        // Broadcast auto-extend to all watchers
        io.to(`product-${productId}`).emit(EVENTS.AUCTION_EXTENDED, {
          productId,
          newEndTime,
          extendedMinutes: 10,
          reason: 'Có lượt đặt giá mới trong 5 phút cuối'
        });
        
        console.log(`[BID] Auction auto-extended for product ${productId}`);
      }

      // STEP 12: Release lock (ASAP to allow other bids)
      await releaseLock(lock);
      lock = null;
      console.log(`[BID] Lock released for product ${productId}`);

      // STEP 13: Broadcast to all users watching this product
      io.to(`product-${productId}`).emit(EVENTS.NEW_BID, {
        productId,
        currentPrice: bidPrice,
        totalBids: parseInt(product.total_bids) + 1,
        bidder: {
          id: userId,
          // Mask name: "Nguyen Van A" → "N***"
          name: `${socket.userName.charAt(0)}${'*'.repeat(socket.userName.length - 1)}`
        },
        timestamp: new Date(),
        wasExtended
      });

      // STEP 14: Notify previous highest bidder (they've been outbid)
      if (previousBidderId) {
        io.to(`user-${previousBidderId}`).emit(EVENTS.OUTBID, {
          productId,
          productTitle: product.title,
          productImage: product.main_image,
          newPrice: bidPrice,
          yourPrice: product.current_price,
          timestamp: new Date()
        });
      }

      // STEP 15: Send success response to bidder
      socket.emit(EVENTS.BID_SUCCESS, {
        bid: {
          id: bid.id,
          productId,
          bidPrice,
          createdAt: bid.created_at
        },
        product: {
          id: productId,
          title: product.title,
          currentPrice: bidPrice,
          totalBids: parseInt(product.total_bids) + 1
        },
        wasExtended
      });

      console.log(`[BID] Success: User ${userId} bid ${bidPrice} on product ${productId}`);

    } catch (error) {
      console.error('[BID] Error:', error);
      
      // Release lock on error
      if (lock) {
        await releaseLock(lock);
      }

      socket.emit(EVENTS.BID_ERROR, { 
        message: 'Đã xảy ra lỗi khi đặt giá, vui lòng thử lại',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  /**
   * Handle: Join product room
   * Users join this room to receive real-time updates for a specific product
   */
  socket.on(EVENTS.JOIN_PRODUCT, (productId) => {
    socket.join(`product-${productId}`);
    console.log(`[ROOM] User ${socket.userId} joined product-${productId}`);
  });

  /**
   * Handle: Leave product room
   * Clean up when user navigates away from product page
   */
  socket.on(EVENTS.LEAVE_PRODUCT, (productId) => {
    socket.leave(`product-${productId}`);
    console.log(`[ROOM] User ${socket.userId} left product-${productId}`);
  });
};
