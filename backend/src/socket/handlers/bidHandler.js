/**
 * AUTO-BIDDING Handler with Redis Distributed Locking
 * 
 * SYSTEM: Users set MAX PRICE → System auto-bids incrementally
 * 
 * AUTO-BIDDING ALGORITHM:
 * - User sets max_price (not direct bid)
 * - System calculates MINIMAL WINNING BID
 * - Only bid what's needed to win (not full max_price)
 * - If outbid, automatically re-bid up to max_price
 * - Multiple users: highest max_price wins at (2nd_highest + step)
 * - Tie-breaker: Earlier timestamp wins
 * 
 * EXAMPLE SCENARIOS:
 * 
 * Scenario 1: Simple Auto-Bid
 * Product at 10M, step 100K
 * User A sets max 11M → System bids 10.1M (current + step)
 * User B sets max 10.8M → System bids 10.9M (B's max + step)
 * Result: A wins at 10.9M (not 11M!)
 * 
 * Scenario 2: Outbid Triggers Auto-Bid
 * Product at 10.5M, A has max 11M (currently winning at 10.5M)
 * User C sets max 11.5M → Triggers A's auto-bid
 * System calculates: A can bid up to 11M, C wins at 11.1M (A's max + step)
 * Result: C wins at minimal 11.1M (not 11.5M!)
 * 
 * Scenario 3: Same Max Price (Tie-Breaker)
 * User A sets max 11M at 10:00:00
 * User B sets max 11M at 10:00:05
 * Result: A wins at 11M (earlier timestamp)
 */

const Bid = require('../../models/Bid');
const Product = require('../../models/Product');
const AutoBid = require('../../models/AutoBid');
const DeniedBidder = require('../../models/DeniedBidder');
const Rating = require('../../models/Rating');
const { acquireLockWithRetry, releaseLock } = require('../../services/lockService');
const { sendBidPlacedEmail } = require('../../utils/email');
const User = require('../../models/User');
const db = require('../../config/database');
const EVENTS = require('../events');

module.exports = (io, socket) => {
  /**
   * Handle: set-auto-bid event (REPLACES manual bidding)
   * 
   * CLIENT SENDS:
   * {
   *   productId: 123,
   *   maxPrice: 15000000
   * }
   * 
   * SERVER RESPONDS:
   * Success: emit('auto-bid-success', { autoBid, actualBidPlaced })
   * Error: emit('bid-error', { message })
   * 
   * BROADCASTS TO ROOM:
   * emit('new-bid', { productId, currentPrice, totalBids, bidder, timestamp })
   */
  socket.on(EVENTS.PLACE_BID, async (data) => {
    const { productId, maxPrice } = data;
    const userId = socket.userId;
    const lockKey = `bid-lock:product-${productId}`;
    let lock = null;

    try {
      console.log(`[AUTO-BID] User ${userId} setting max ${maxPrice} on product ${productId}`);

      // STEP 1: Acquire distributed lock
      lock = await acquireLockWithRetry(lockKey, 5000, 3, 100);
      
      if (!lock) {
        console.log(`[AUTO-BID] Lock acquisition failed for product ${productId}`);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: 'Có nhiều người đang đấu giá, vui lòng thử lại sau 1 giây',
          code: 'LOCK_FAILED'
        });
      }

      console.log(`[AUTO-BID] Lock acquired: ${lock.key}`);

      // STEP 2: Get product details (FRESH data after lock)
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

      // For unrated users, check system setting AND seller permission
      if (totalRatings === 0) {
        const settingResult = await db.query(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'allow_unrated_bidders'"
        );
        const allowUnrated = settingResult.rows[0]?.setting_value === 'true';
        
        const permissionResult = await db.query(
          'SELECT id FROM unrated_bidder_permissions WHERE product_id = $1 AND bidder_id = $2',
          [productId, userId]
        );
        const hasSellerPermission = permissionResult.rows.length > 0;

        if (!allowUnrated && !hasSellerPermission) {
          await releaseLock(lock);
          return socket.emit(EVENTS.BID_ERROR, { 
            message: 'Bạn cần có đánh giá hoặc được người bán cho phép trước khi đấu giá',
            code: 'NO_RATINGS'
          });
        }
      }

      // STEP 7: Validate max price
      if (maxPrice <= product.current_price) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: `Giá tối đa phải lớn hơn giá hiện tại ${product.current_price.toLocaleString('vi-VN')} VND`,
          code: 'MAX_PRICE_TOO_LOW',
          currentPrice: product.current_price
        });
      }

      // STEP 8: Save/Update auto-bid configuration
      const existingAutoBid = await AutoBid.getActive(userId, productId);
      const isCurrentWinner = product.winner_id === userId;
      
      await AutoBid.createOrUpdate(userId, productId, maxPrice);
      console.log(`[AUTO-BID] Config saved: User ${userId} max ${maxPrice}`);

      // SPECIAL CASE: If user is already winning and just updating their max price
      // Only update the auto-bid config, don't place a new bid
      if (isCurrentWinner && existingAutoBid) {
        console.log(`[AUTO-BID] User ${userId} is current winner, just updating max price to ${maxPrice}`);
        await releaseLock(lock);
        
        return socket.emit(EVENTS.BID_SUCCESS, {
          message: 'Giá tối đa của bạn đã được cập nhật',
          autoBid: {
            userId,
            productId,
            maxPrice,
            isCurrentWinner: true
          },
          currentPrice: product.current_price,
          actualBidPlaced: false // No new bid placed
        });
      }

      // STEP 9: Calculate minimal winning bid
      // Get all active auto-bids for this product (excluding current user)
      const allAutoBids = await AutoBid.getAllActiveForProduct(productId);
      const otherAutoBids = allAutoBids.filter(ab => ab.user_id !== userId);
      
      let actualBidPrice;
      let previousWinnerId = null;

      if (otherAutoBids.length === 0) {
        // No competition: bid current_price + step
        actualBidPrice = parseFloat(product.current_price) + parseFloat(product.bid_step);
      } else {
        // Sort by max_price DESC, created_at ASC (higher max wins, earlier timestamp breaks ties)
        otherAutoBids.sort((a, b) => {
          const priceDiff = parseFloat(b.max_price) - parseFloat(a.max_price);
          if (priceDiff !== 0) return priceDiff;
          return new Date(a.created_at) - new Date(b.created_at);
        });

        const highestCompetitor = otherAutoBids[0];
        const highestCompetitorMax = parseFloat(highestCompetitor.max_price);

        if (maxPrice > highestCompetitorMax) {
          // Current user wins: bid competitor's max + step
          actualBidPrice = highestCompetitorMax + parseFloat(product.bid_step);
          previousWinnerId = highestCompetitor.user_id;
        } else if (maxPrice === highestCompetitorMax) {
          // Tie: check timestamps
          const currentUserConfig = allAutoBids.find(ab => ab.user_id === userId);
          if (new Date(currentUserConfig.created_at) < new Date(highestCompetitor.created_at)) {
            // Current user was first: wins at max_price
            actualBidPrice = maxPrice;
            previousWinnerId = highestCompetitor.user_id;
          } else {
            // Competitor was first: current user cannot outbid
            await releaseLock(lock);
            return socket.emit(EVENTS.BID_ERROR, { 
              message: `Giá tối đa của bạn bằng người khác nhưng bạn đặt sau. Hãy tăng giá tối đa để thắng.`,
              code: 'MAX_PRICE_TIE_LOST',
              currentPrice: product.current_price
            });
          }
        } else {
          // Current user's max is lower: cannot win
          await releaseLock(lock);
          return socket.emit(EVENTS.BID_ERROR, { 
            message: `Giá tối đa của bạn thấp hơn người khác. Giá hiện tại: ${product.current_price.toLocaleString('vi-VN')} VND`,
            code: 'MAX_PRICE_TOO_LOW_COMPETITION',
            currentPrice: product.current_price
          });
        }
      }

      // Ensure actualBidPrice doesn't exceed user's maxPrice
      if (actualBidPrice > maxPrice) {
        actualBidPrice = maxPrice;
      }

      // Ensure actualBidPrice meets minimum requirement
      const minValidBid = parseFloat(product.current_price) + parseFloat(product.bid_step);
      if (actualBidPrice < minValidBid) {
        actualBidPrice = minValidBid;
      }

      // STEP 10: Create bid in database
      const bid = await Bid.create(productId, userId, actualBidPrice, true); // is_auto = true
      console.log(`[AUTO-BID] Bid placed: ${bid.id} at ${actualBidPrice}`);

      // STEP 11: Update product
      await db.query(
        `UPDATE products 
         SET current_price = $1, 
             total_bids = total_bids + 1,
             winner_id = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [actualBidPrice, userId, productId]
      );

      // STEP 12: Check auto-extend (if bid placed within 5 minutes of end time)
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
        
        io.to(`product-${productId}`).emit(EVENTS.AUCTION_EXTENDED, {
          productId,
          newEndTime,
          extendedMinutes: 10,
          reason: 'Có lượt đặt giá mới trong 5 phút cuối'
        });
        
        console.log(`[AUTO-BID] Auction auto-extended for product ${productId}`);
      }

      // STEP 13: Send email notifications
      try {
        // Get seller info
        const seller = await User.findById(product.seller_id);
        if (seller && seller.email) {
          await sendBidPlacedEmail(
            seller.email,
            seller.full_name,
            product.title,
            productId,
            actualBidPrice,
            false // not outbid
          );
        }

        // Get current bidder info
        const bidder = await User.findById(userId);
        if (bidder && bidder.email) {
          await sendBidPlacedEmail(
            bidder.email,
            bidder.full_name,
            product.title,
            productId,
            actualBidPrice,
            false // not outbid
          );
        }

        // Notify previous winner (outbid)
        if (previousWinnerId) {
          const previousWinner = await User.findById(previousWinnerId);
          if (previousWinner && previousWinner.email) {
            await sendBidPlacedEmail(
              previousWinner.email,
              previousWinner.full_name,
              product.title,
              productId,
              actualBidPrice,
              true // is outbid
            );
          }
        }
      } catch (emailError) {
        console.error('[AUTO-BID] Email notification error:', emailError);
        // Don't fail the bid if email fails
      }

      // STEP 14: Release lock (ASAP)
      await releaseLock(lock);
      lock = null;
      console.log(`[AUTO-BID] Lock released for product ${productId}`);

      // STEP 15: Broadcast to all watchers
      io.to(`product-${productId}`).emit(EVENTS.NEW_BID, {
        productId,
        currentPrice: actualBidPrice,
        totalBids: parseInt(product.total_bids) + 1,
        bidder: {
          id: userId,
          // Mask name: "Nguyen Van A" → "N***"
          name: `${socket.userName.charAt(0)}${'*'.repeat(socket.userName.length - 1)}`
        },
        timestamp: new Date(),
        wasExtended,
        isAutoBid: true
      });

      // STEP 16: Notify previous winner (they've been outbid)
      if (previousWinnerId) {
        io.to(`user-${previousWinnerId}`).emit(EVENTS.OUTBID, {
          productId,
          productTitle: product.title,
          productImage: product.main_image,
          newPrice: actualBidPrice,
          yourMaxPrice: otherAutoBids.find(ab => ab.user_id === previousWinnerId)?.max_price,
          timestamp: new Date()
        });
      }

      // STEP 17: Send success response to user
      socket.emit(EVENTS.BID_SUCCESS, {
        autoBid: {
          productId,
          maxPrice,
          actualBidPlaced: actualBidPrice,
          savings: maxPrice - actualBidPrice // how much they saved
        },
        bid: {
          id: bid.id,
          productId,
          bidPrice: actualBidPrice,
          createdAt: bid.created_at
        },
        product: {
          id: productId,
          title: product.title,
          currentPrice: actualBidPrice,
          totalBids: parseInt(product.total_bids) + 1
        },
        wasExtended
      });

      console.log(`[AUTO-BID] Success: User ${userId} max ${maxPrice} → bid ${actualBidPrice} (saved ${maxPrice - actualBidPrice})`);

    } catch (error) {
      console.error('[AUTO-BID] Error:', error);
      
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
   */
  socket.on(EVENTS.JOIN_PRODUCT, (productId) => {
    socket.join(`product-${productId}`);
    console.log(`[ROOM] User ${socket.userId} joined product-${productId}`);
  });

  /**
   * Handle: Leave product room
   */
  socket.on(EVENTS.LEAVE_PRODUCT, (productId) => {
    socket.leave(`product-${productId}`);
    console.log(`[ROOM] User ${socket.userId} left product-${productId}`);
  });
};
