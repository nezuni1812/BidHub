/**
 * Socket.IO Event Constants
 * Centralized event names for consistency
 */

module.exports = {
  // Client → Server Events
  JOIN_PRODUCT: 'join-product',
  LEAVE_PRODUCT: 'leave-product',
  PLACE_BID: 'place-bid',
  SUBSCRIBE_COUNTDOWN: 'subscribe-countdown',
  UNSUBSCRIBE_COUNTDOWN: 'unsubscribe-countdown',
  
  // Server → Client Events
  NEW_BID: 'new-bid',
  BID_SUCCESS: 'bid-success',
  BID_ERROR: 'bid-error',
  OUTBID: 'outbid',
  AUCTION_EXTENDED: 'auction-extended',
  AUCTION_ENDING_SOON: 'auction-ending-soon',
  AUCTION_ENDED: 'auction-ended',
  PRICE_UPDATE: 'price-update',
  
  // Connection Events
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error'
};
