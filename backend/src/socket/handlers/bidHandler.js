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
      // Ensure end_time is parsed as GMT+7 local time (handle both Date object and string)
      const endTime = product.end_time instanceof Date ? product.end_time : new Date(product.end_time);
      // Add 7 hours to current time to compare with GMT+7 end_time
      
      // 🕐 DEBUG: Log time comparison
      console.log('⏰ [BID TIME CHECK]', {
        productId,
        now: now.toISOString(),
        nowLocal: now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        endTime: endTime.toISOString(),
        endTimeLocal: endTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        endTimeRaw: product.end_time,
        isExpired: endTime <= now,
        difference: Math.floor((endTime.getTime() - now.getTime()) / 1000) + 's'
      });
      
      if (endTime <= now) {
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
      const minMaxPrice = parseFloat(product.current_price) + parseFloat(product.bid_step);
      if (maxPrice < minMaxPrice) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { 
          message: `Giá tối đa phải lớn hơn hoặc bằng ${minMaxPrice.toLocaleString('vi-VN')} VND`,
          code: 'MAX_PRICE_TOO_LOW',
          currentPrice: product.current_price,
          minMaxPrice
        });
      }

      // STEP 7.5: Validate max price is a valid increment (multiple of bidStep from currentPrice)
      const currentPrice = parseFloat(product.current_price);
      const bidStep = parseFloat(product.bid_step);
      const priceIncrement = maxPrice - currentPrice;
      const remainder = priceIncrement % bidStep;

      if (Math.abs(remainder) > 0.01) { // Allow small floating point errors
        await releaseLock(lock);
        
        // Calculate the nearest valid prices
        const roundedDown = currentPrice + (Math.floor(priceIncrement / bidStep) * bidStep);
        const roundedUp = currentPrice + (Math.ceil(priceIncrement / bidStep) * bidStep);
        
        return socket.emit(EVENTS.BID_ERROR, { 
          message: `Giá tối đa phải là bội số của bước nhảy ${bidStep.toLocaleString('vi-VN')} VND từ giá hiện tại. Giá hợp lệ gần nhất: ${roundedDown.toLocaleString('vi-VN')} VND hoặc ${roundedUp.toLocaleString('vi-VN')} VND`,
          code: 'INVALID_BID_INCREMENT',
          currentPrice: product.current_price,
          bidStep: product.bid_step,
          suggestedPrices: [roundedDown, roundedUp]
        });
      }

      // STEP 8: Save/Update auto-bid configuration for current user
      await AutoBid.createOrUpdate(userId, productId, maxPrice);
      console.log(`[AUTO-BID] Config saved: User ${userId} max ${maxPrice}`);

      // STEP 9: Calculate optimal bid price – PHIÊN BẢN CUỐI CÙNG, ĐÚNG TUYỆT ĐỐI
      // Reuse currentPrice and bidStep from STEP 7.5
      let previousWinnerId = product.winner_id;

      // Lấy tất cả auto-bid hiện có
      const allAutoBids = await AutoBid.getAllActiveForProduct(productId);

      if (allAutoBids.length === 0) {
        await releaseLock(lock);
        return socket.emit(EVENTS.BID_ERROR, { message: 'Không tìm thấy auto-bid', code: 'NO_AUTO_BID' });
      }

      // Sort: max cao nhất trước, nếu bằng thì người đến trước thắng
      allAutoBids.sort((a, b) => {
        const diff = parseFloat(b.max_price) - parseFloat(a.max_price);
        if (diff !== 0) return diff;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      const winner = allAutoBids[0];
      const winnerId = winner.user_id;
      const winnerMaxPrice = parseFloat(winner.max_price);

      let actualBidPrice = currentPrice;
      let bidPlacedByUserId = winnerId;

      // TRƯỜNG HỢP DUY NHẤT: CHỈ CÓ 1 NGƯỜI ĐẶT AUTO-BID
      if (allAutoBids.length === 1) {
        // Người đầu tiên → KHÔNG TĂNG GIÁ, giữ nguyên current_price
        // (Chỉ tăng khi có đối thủ)
        actualBidPrice = currentPrice;

      } else {
        // CÓ TỪ 2 NGƯỜI TRỞ LÊN → mới tính proxy bidding
        const secondHighest = allAutoBids[1];
        const secondMaxPrice = parseFloat(secondHighest.max_price);
        const secondTimestamp = new Date(secondHighest.created_at);
        const firstTimestamp = new Date(winner.created_at);

        if (winnerMaxPrice === secondMaxPrice) {
          // Bằng giá → người đến trước thắng, giá = max đó
          actualBidPrice = winnerMaxPrice;
        } else {
          if (firstTimestamp < secondTimestamp) {
            // Người thắng đến trước
            bidPlacedByUserId = winnerId;
            actualBidPrice = secondMaxPrice;

          } else {
            // Người thắng đến sau
            bidPlacedByUserId = winnerId;
            actualBidPrice = secondMaxPrice + bidStep;
          }
        }
      }

      // So sánh thay đổi
      const priceChanged = Math.abs(actualBidPrice - currentPrice) > 0.0001;
      const winnerChanged = winnerId !== previousWinnerId;

      if (!priceChanged && !winnerChanged) {
        // No change needed
        console.log(`[AUTO-BID] No change: Winner ${winnerId} still winning at ${actualBidPrice}`);
        await releaseLock(lock);
        
        return socket.emit(EVENTS.BID_SUCCESS, {
          message: 'Giá tối đa của bạn đã được cập nhật',
          autoBid: {
            userId,
            productId,
            maxPrice,
            isCurrentWinner: winnerId === userId
          },
          currentPrice: product.current_price,
          actualBidPlaced: false
        });
      }

      // STEP 10: Create bid in database (placed by the winner)
      const bid = await Bid.create(productId, bidPlacedByUserId, actualBidPrice, true); // is_auto = true
      console.log(`[AUTO-BID] Bid placed: ${bid.id} by User ${bidPlacedByUserId} at ${actualBidPrice}`);

      // STEP 11: Check if Buy Now price is reached or exceeded
      const buyNowPrice = product.buy_now_price ? parseFloat(product.buy_now_price) : null;
      const isBuyNow = buyNowPrice && actualBidPrice >= buyNowPrice;

      // STEP 11.5: Update product with winner
      if (isBuyNow) {
        // Buy Now triggered - end auction immediately
        await db.query(
          `UPDATE products 
           SET current_price = $1, 
               total_bids = total_bids + 1,
               winner_id = $2,
               status = 'completed',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [actualBidPrice, winnerId, productId]
        );
        console.log(`[BUY NOW] Product ${productId} sold via Buy Now to user ${winnerId} at ${actualBidPrice}`);
        
        // Create order immediately
        const Order = require('../../models/Order');
        await Order.create(productId, winnerId, product.seller_id, actualBidPrice);
        console.log(`[BUY NOW] Order created for product ${productId}`);
      } else {
        // Normal bid - auction continues
        await db.query(
          `UPDATE products 
           SET current_price = $1, 
               total_bids = total_bids + 1,
               winner_id = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [actualBidPrice, winnerId, productId]
        );
      }

      // STEP 12: Check auto-extend (if bid placed within 5 minutes of end time)
      // Skip auto-extend if Buy Now was triggered
      const timeLeft = new Date(product.end_time) - now;
      const autoExtendThreshold = 5 * 60 * 1000; // 5 minutes
      const autoExtendDuration = 10 * 60 * 1000; // 10 minutes
      let wasExtended = false;

      if (!isBuyNow && product.auto_extend && timeLeft < autoExtendThreshold) {
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
      /*
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
      */

      // STEP 14: Release lock (ASAP)
      await releaseLock(lock);
      lock = null;
      console.log(`[AUTO-BID] Lock released for product ${productId}`);

      // STEP 15: Broadcast to all watchers
      const winnerUser = await User.findById(winnerId);
      
      if (isBuyNow) {
        // Broadcast AUCTION_ENDED for Buy Now
        io.to(`product-${productId}`).emit(EVENTS.AUCTION_ENDED, {
          productId,
          productTitle: product.title,
          finalPrice: actualBidPrice,
          totalBids: parseInt(product.total_bids) + 1,
          hasWinner: true,
          winnerId,
          winnerName: winnerUser ? winnerUser.full_name : 'Anonymous',
          reason: 'Buy Now',
          endTime: new Date()
        });
        
        // Notify winner
        io.to(`user-${winnerId}`).emit(EVENTS.AUCTION_ENDED, {
          productId,
          productTitle: product.title,
          finalPrice: actualBidPrice,
          type: 'winner',
          reason: 'Buy Now',
          message: 'Chúc mừng! Bạn đã mua sản phẩm với giá Buy Now'
        });
        
        console.log(`[BUY NOW] Broadcast auction ended for product ${productId}`);
      } else {
        // Normal bid broadcast
        io.to(`product-${productId}`).emit(EVENTS.NEW_BID, {
          productId,
          currentPrice: actualBidPrice,
          totalBids: parseInt(product.total_bids) + 1,
          bidder: {
            id: winnerId,
            // Mask name: "Nguyen Van A" → "N***"
            name: winnerUser ? `${winnerUser.full_name.charAt(0)}${'*'.repeat(winnerUser.full_name.length - 1)}` : 'Anonymous'
          },
          timestamp: new Date(),
          wasExtended,
          isAutoBid: true
        });
      }

      // STEP 16: Notify previous winner (they've been outbid) - Skip if Buy Now
      if (!isBuyNow && previousWinnerId && previousWinnerId !== winnerId) {
        const outbidUser = allAutoBids.find(ab => ab.user_id === previousWinnerId);
        const mainImage = product.images?.find(img => img.is_main)?.url || null;
        io.to(`user-${previousWinnerId}`).emit(EVENTS.OUTBID, {
          productId,
          productTitle: product.title,
          productImage: mainImage,
          newPrice: actualBidPrice,
          yourMaxPrice: outbidUser ? parseFloat(outbidUser.max_price) : null,
          timestamp: new Date()
        });
      }

      // STEP 17: Notify losers (users with lower max_price than winner)
      const losers = allAutoBids.filter(ab => 
        ab.user_id !== winnerId && 
        ab.user_id === userId && // Only notify the user who just placed bid
        parseFloat(ab.max_price) < winnerMaxPrice
      );
      
      const mainImage = product.images?.find(img => img.is_main)?.url || null;
      for (const loser of losers) {
        io.to(`user-${loser.user_id}`).emit(EVENTS.OUTBID, {
          productId,
          productTitle: product.title,
          productImage: mainImage,
          newPrice: actualBidPrice,
          yourMaxPrice: parseFloat(loser.max_price),
          timestamp: new Date()
        });
      }

      // STEP 18: Send success response to user who triggered this
      const isWinner = winnerId === userId;
      socket.emit(EVENTS.BID_SUCCESS, {
        autoBid: {
          productId,
          maxPrice,
          actualBidPlaced: isWinner ? actualBidPrice : null,
          isWinner,
          currentWinner: winnerId,
          savings: isWinner ? (winnerMaxPrice - actualBidPrice) : 0,
          isBuyNow
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
          totalBids: parseInt(product.total_bids) + 1,
          status: isBuyNow ? 'completed' : 'active'
        },
        wasExtended,
        isBuyNow
      });

      console.log(`[AUTO-BID] Success: Winner ${winnerId} bid ${actualBidPrice} | Triggered by User ${userId} max ${maxPrice} | Winner saved ${winnerMaxPrice - actualBidPrice} | Buy Now: ${isBuyNow}`);

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
