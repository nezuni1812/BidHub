/**
 * Background Jobs Scheduler for Auction Platform
 * 
 * JOBS:
 * 1. Check ending auctions (every minute) → send countdown warnings
 * 2. Close ended auctions (every 5 minutes) → update status, notify winner
 * 3. Cleanup expired locks (every 10 minutes) → prevent lock leaks
 * 
 * USE CASE FLOW:
 * 
 * Timeline: Product ends at 14:00:00
 * 
 * 13:55:00 → Job runs → 5 minutes left → emit 'auction-ending-soon' (5 min warning)
 * 13:58:00 → Job runs → 2 minutes left → emit 'auction-ending-soon' (2 min warning)
 * 13:59:00 → Job runs → 1 minute left → emit 'auction-ending-soon' (1 min warning)
 * 14:00:01 → Job runs → ENDED → emit 'auction-ended' → notify winner → update DB
 * 
 * AUTO-EXTEND SCENARIO:
 * 13:59:30 → New bid placed → end_time extended to 14:09:30
 * 14:04:30 → Job runs → 5 minutes left → emit 'auction-ending-soon'
 * ... (cycle repeats if more bids within 5 min)
 */

const cron = require('node-cron');
const db = require('../config/database');
const Product = require('../models/Product');
const AutoBid = require('../models/AutoBid');
const User = require('../models/User');
const Order = require('../models/Order');
const { sendAuctionEndedWinnerEmail, sendAuctionEndedNoWinnerEmail } = require('../utils/email');
const EVENTS = require('../socket/events');

let io = null;

/**
 * Initialize scheduler with Socket.IO instance
 */
function initScheduler(socketIo) {
  io = socketIo;
  
  console.log('🕐 Auction scheduler initialized');
  
  // Start all cron jobs
  startEndingSoonJob();
  startEndAuctionsJob();
  startCleanupJob();
  startSellerDegradationJob();
}

/**
 * JOB 1: Check auctions ending soon (every minute)
 * Sends warnings at 30 min, 10 min, 5 min, 2 min, 1 min, 30 sec
 */
function startEndingSoonJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Warning thresholds
      const thresholds = [
        { minutes: 30, alerted: false },
        { minutes: 10, alerted: false },
        { minutes: 5, alerted: false },
        { minutes: 2, alerted: false },
        { minutes: 1, alerted: false }
      ];

      for (const threshold of thresholds) {
        const targetTime = new Date(now.getTime() + threshold.minutes * 60 * 1000);
        
        // Find auctions ending within this threshold window (±30 seconds)
        const query = `
          SELECT id, title, end_time, current_price, seller_id
          FROM products
          WHERE status = 'active'
            AND end_time BETWEEN $1 AND $2
        `;
        
        const result = await db.query(query, [
          new Date(targetTime.getTime() - 30000), // -30 seconds
          new Date(targetTime.getTime() + 30000)  // +30 seconds
        ]);

        for (const product of result.rows) {
          const secondsLeft = Math.floor((new Date(product.end_time) - now) / 1000);
          
          // Broadcast to all users watching this product
          io.to(`product-${product.id}`).emit(EVENTS.AUCTION_ENDING_SOON, {
            productId: product.id,
            productTitle: product.title,
            secondsLeft,
            minutesLeft: threshold.minutes,
            endTime: product.end_time,
            currentPrice: product.current_price
          });

          // Notify seller
          io.to(`user-${product.seller_id}`).emit(EVENTS.AUCTION_ENDING_SOON, {
            productId: product.id,
            productTitle: product.title,
            secondsLeft,
            minutesLeft: threshold.minutes,
            type: 'seller'
          });

          console.log(`[SCHEDULER] Auction ending soon alert: Product ${product.id} - ${threshold.minutes} min left`);
        }
      }
    } catch (error) {
      console.error('[SCHEDULER] Error in ending soon job:', error);
    }
  });

  console.log('✓ Ending soon job started (runs every minute)');
}

/**
 * JOB 2: End auctions and notify winners (every 5 minutes)
 * 
 * FLOW:
 * 1. Find auctions where end_time has passed
 * 2. Update status to 'completed'
 * 3. Notify winner
 * 4. Notify seller
 * 5. Broadcast to all watchers
 */
function startEndAuctionsJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const query = `
        SELECT 
          p.id,
          p.title,
          p.current_price,
          p.start_price,
          p.seller_id,
          p.winner_id,
          p.total_bids,
          p.end_time,
          u.full_name as winner_name,
          u.email as winner_email,
          s.full_name as seller_name,
          s.email as seller_email
        FROM products p
        LEFT JOIN users u ON p.winner_id = u.id
        LEFT JOIN users s ON p.seller_id = s.id
        WHERE p.status = 'active'
          AND p.end_time < CURRENT_TIMESTAMP
      `;
      
      const result = await db.query(query);
      
      if (result.rows.length === 0) {
        return; // No auctions to end
      }

      console.log(`[SCHEDULER] Ending ${result.rows.length} auctions`);

      for (const product of result.rows) {
        // Update product status
        await db.query(
          `UPDATE products 
           SET status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [product.id]
        );

        const hasWinner = product.winner_id && product.total_bids > 0;

        // Broadcast to all watchers
        io.to(`product-${product.id}`).emit(EVENTS.AUCTION_ENDED, {
          productId: product.id,
          productTitle: product.title,
          finalPrice: product.current_price,
          startPrice: product.start_price,
          totalBids: product.total_bids,
          hasWinner,
          winnerId: product.winner_id,
          endTime: product.end_time
        });

        if (hasWinner) {
          // Create order automatically
          try {
            await Order.create(
              product.id,
              product.winner_id,
              product.seller_id,
              product.current_price
            );
            console.log(`[SCHEDULER] Order created for product ${product.id}`);
          } catch (orderError) {
            console.error('[SCHEDULER] Error creating order:', orderError);
          }

          // Notify winner
          io.to(`user-${product.winner_id}`).emit(EVENTS.AUCTION_ENDED, {
            productId: product.id,
            productTitle: product.title,
            finalPrice: product.current_price,
            type: 'winner',
            message: `Chúc mừng! Bạn đã thắng đấu giá "${product.title}" với giá ${product.current_price.toLocaleString('vi-VN')} VND`,
            sellerEmail: product.seller_email
          });

          // Notify seller
          io.to(`user-${product.seller_id}`).emit(EVENTS.AUCTION_ENDED, {
            productId: product.id,
            productTitle: product.title,
            finalPrice: product.current_price,
            type: 'seller',
            message: `Sản phẩm "${product.title}" đã kết thúc đấu giá với giá ${product.current_price.toLocaleString('vi-VN')} VND`,
            winnerName: product.winner_name,
            winnerEmail: product.winner_email
          });

          console.log(`[SCHEDULER] Auction ended with winner: Product ${product.id} - Winner ${product.winner_id}`);
        } else {
          // No bids - notify seller
          io.to(`user-${product.seller_id}`).emit(EVENTS.AUCTION_ENDED, {
            productId: product.id,
            productTitle: product.title,
            type: 'seller',
            message: `Sản phẩm "${product.title}" đã kết thúc đấu giá nhưng không có người đặt giá`,
            hasWinner: false
          });

          console.log(`[SCHEDULER] Auction ended with no bids: Product ${product.id}`);
        }

        // Deactivate all auto-bids for ended auction
        await AutoBid.deactivateAllForProduct(product.id);

        // Send email notifications
        try {
          const seller = await User.findById(product.seller_id);
          
          if (product.winner_id) {
            // Get winner info
            const winner = await User.findById(product.winner_id);
            
            // Email to winner
            if (winner && winner.email) {
              await sendAuctionEndedWinnerEmail(
                winner.email,
                winner.full_name,
                product.title,
                product.id,
                product.current_price,
                true // isWinner
              );
            }

            // Email to seller
            if (seller && seller.email) {
              await sendAuctionEndedWinnerEmail(
                seller.email,
                seller.full_name,
                product.title,
                product.id,
                product.current_price,
                false // not winner (is seller)
              );
            }
          } else {
            // No winner - email seller
            if (seller && seller.email) {
              await sendAuctionEndedNoWinnerEmail(
                seller.email,
                seller.full_name,
                product.title,
                product.id
              );
            }
          }
        } catch (emailError) {
          console.error('[SCHEDULER] Email notification error:', emailError);
          // Don't fail auction end if email fails
        }
      }

    } catch (error) {
      console.error('[SCHEDULER] Error in end auctions job:', error);
    }
  });

  console.log('✓ End auctions job started (runs every 5 minutes)');
}

/**
 * JOB 3: Cleanup old data (every 10 minutes)
 * Prevents memory leaks and stale data
 */
function startCleanupJob() {
  cron.schedule('*/10 * * * *', async () => {
    try {
      // Cleanup: Remove expired OTP codes
      await db.query(
        `UPDATE users 
         SET otp_code = NULL, otp_expired_at = NULL
         WHERE otp_expired_at < CURRENT_TIMESTAMP`
      );

      // Cleanup: Remove old expired refresh tokens
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      await db.query(
        'DELETE FROM refresh_tokens WHERE expires_at < $1',
        [oneMonthAgo]
      );

      console.log('[SCHEDULER] Cleanup job completed');
    } catch (error) {
      console.error('[SCHEDULER] Error in cleanup job:', error);
    }
  });

  console.log('✓ Cleanup job started (runs every 10 minutes)');
}

/**
 * JOB 4: Degrade expired sellers back to bidders (every 1 hour)
 * Automatically downgrades temporary sellers after their 7-day period
 */
function startSellerDegradationJob() {
  cron.schedule('0 * * * *', async () => {
    try {
      // Find sellers whose seller_until has expired
      const query = `
        UPDATE users
        SET role = 'bidder', seller_until = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE role = 'seller' 
          AND seller_until IS NOT NULL
          AND seller_until < CURRENT_TIMESTAMP
        RETURNING id, full_name, email
      `;
      
      const result = await db.query(query);
      
      if (result.rows.length > 0) {
        console.log(`[SCHEDULER] Degraded ${result.rows.length} expired sellers back to bidders:`);
        result.rows.forEach(user => {
          console.log(`  - User ${user.id}: ${user.full_name} (${user.email})`);
          
          // Notify user about role change
          if (io) {
            io.to(`user-${user.id}`).emit(EVENTS.ROLE_CHANGED, {
              userId: user.id,
              oldRole: 'seller',
              newRole: 'bidder',
              reason: 'temporary_seller_expired',
              message: 'Your temporary seller status has expired. Please submit a new upgrade request to become a seller again.'
            });
          }
        });
      } else {
        console.log('[SCHEDULER] No expired sellers to degrade');
      }
    } catch (error) {
      console.error('[SCHEDULER] Error in seller degradation job:', error);
    }
  });

  console.log('✓ Seller degradation job started (runs every hour)');
}

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
function stopScheduler() {
  cron.getTasks().forEach(task => task.stop());
  console.log('🛑 Auction scheduler stopped');
}

module.exports = {
  initScheduler,
  stopScheduler
};
