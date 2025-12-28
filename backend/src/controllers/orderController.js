const asyncHandler = require('../middleware/asyncHandler');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Rating = require('../models/Rating');
const db = require('../config/database');
const stripe = require('../config/stripe');
const { convertVNDtoUSDCents } = require('../services/exchangeRateService');

/**
 * @desc    Get order details
 * @route   GET /api/v1/orders/:orderId
 * @access  Private (Buyer or Seller of the order)
 */
const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user is buyer or seller
  if (order.buyer_id !== userId && order.seller_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this order');
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * @desc    Get order by product ID
 * @route   GET /api/v1/orders/product/:productId
 * @access  Private (Buyer or Seller)
 */
const getOrderByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const order = await Order.getByProductId(productId);

  if (!order) {
    throw new NotFoundError('No order found for this product');
  }

  // Check if user is buyer or seller
  if (order.buyer_id !== userId && order.seller_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this order');
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * @desc    Update payment information
 * @route   PUT /api/v1/orders/:orderId/payment
 * @access  Private (Buyer only)
 */
const updatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { payment_method, payment_transaction_id } = req.body;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.buyer_id !== userId) {
    throw new ForbiddenError('Only buyer can update payment');
  }

  if (order.order_status !== 'pending_payment') {
    throw new BadRequestError('Cannot update payment for this order status');
  }

  const updatedOrder = await Order.updatePayment(orderId, {
    payment_method,
    payment_status: 'completed',
    payment_transaction_id
  });

  // Update order status to paid
  await Order.updateStatus(orderId, 'paid');

  // Notify seller via socket
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${order.seller_id}`).emit('payment-received', {
      orderId: order.id,
      productId: order.product_id,
      buyerName: order.buyer_name,
      amount: order.total_price
    });
  }

  res.json({
    success: true,
    message: 'Payment information updated successfully',
    data: updatedOrder
  });
});

/**
 * @desc    Update shipping address
 * @route   PUT /api/v1/orders/:orderId/shipping-address
 * @access  Private (Buyer only)
 */
const updateShippingAddress = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { shipping_address } = req.body;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.buyer_id !== userId) {
    throw new ForbiddenError('Only buyer can update shipping address');
  }

  const updatedOrder = await Order.updateShippingAddress(orderId, shipping_address);

  // Notify seller
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${order.seller_id}`).emit('shipping-address-updated', {
      orderId: order.id,
      address: shipping_address
    });
  }

  res.json({
    success: true,
    message: 'Shipping address updated successfully',
    data: updatedOrder
  });
});

/**
 * @desc    Update shipping info (seller confirms shipment)
 * @route   PUT /api/v1/orders/:orderId/shipping
 * @access  Private (Seller only)
 */
const updateShipping = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { tracking_number } = req.body;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.seller_id !== userId) {
    throw new ForbiddenError('Only seller can update shipping info');
  }

  if (order.payment_status !== 'completed') {
    throw new BadRequestError('Cannot ship order before payment is completed');
  }

  const updatedOrder = await Order.updateShipping(orderId, {
    shipping_status: 'shipped',
    tracking_number
  });

  // Update order status
  await Order.updateStatus(orderId, 'shipping');

  // Notify buyer
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${order.buyer_id}`).emit('order-shipped', {
      orderId: order.id,
      trackingNumber: tracking_number
    });
  }

  res.json({
    success: true,
    message: 'Shipping information updated successfully',
    data: updatedOrder
  });
});

/**
 * @desc    Confirm delivery (buyer received goods)
 * @route   PUT /api/v1/orders/:orderId/confirm-delivery
 * @access  Private (Buyer only)
 */
const confirmDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.buyer_id !== userId) {
    throw new ForbiddenError('Only buyer can confirm delivery');
  }

  if (order.shipping_status !== 'shipped') {
    throw new BadRequestError('Order has not been shipped yet');
  }

  const updatedOrder = await Order.confirmDelivery(orderId);

  // Notify seller
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${order.seller_id}`).emit('delivery-confirmed', {
      orderId: order.id
    });
  }

  res.json({
    success: true,
    message: 'Delivery confirmed successfully',
    data: updatedOrder
  });
});

/**
 * @desc    Rate transaction
 * @route   POST /api/v1/orders/:orderId/rate
 * @access  Private (Buyer or Seller)
 */
const rateTransaction = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user is buyer or seller
  const isBuyer = order.buyer_id === userId;
  const isSeller = order.seller_id === userId;

  if (!isBuyer && !isSeller) {
    throw new ForbiddenError('You do not have permission to rate this order');
  }

  // Check if already rated
  if (isBuyer && order.buyer_rating !== null) {
    throw new BadRequestError('You have already rated this order');
  }
  if (isSeller && order.seller_rating !== null) {
    throw new BadRequestError('You have already rated this order');
  }

  // Validate rating
  if (![1, -1].includes(rating)) {
    throw new BadRequestError('Rating must be 1 or -1');
  }

  // Update order rating
  const updatedOrder = await Order.rateTransaction(orderId, userId, rating, comment, isBuyer);

  // Create user rating
  const ratedUserId = isBuyer ? order.seller_id : order.buyer_id;
  await Rating.create(userId, ratedUserId, order.product_id, rating, comment);

  // Notify other party
  const io = req.app.get('io');
  if (io) {
    const otherUserId = isBuyer ? order.seller_id : order.buyer_id;
    io.to(`user-${otherUserId}`).emit('rating-received', {
      orderId: order.id,
      rating,
      from: isBuyer ? 'buyer' : 'seller'
    });
  }

  res.json({
    success: true,
    message: 'Rating submitted successfully',
    data: updatedOrder
  });
});

/**
 * @desc    Cancel order
 * @route   PUT /api/v1/orders/:orderId/cancel
 * @access  Private (Seller can cancel anytime, Buyer before payment)
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const isBuyer = order.buyer_id === userId;
  const isSeller = order.seller_id === userId;

  if (!isBuyer && !isSeller) {
    throw new ForbiddenError('You do not have permission to cancel this order');
  }

  // Buyer can only cancel before payment
  if (isBuyer && order.payment_status === 'completed') {
    throw new BadRequestError('Cannot cancel order after payment. Please contact seller.');
  }

  // Seller can cancel anytime
  const updatedOrder = await Order.cancel(orderId, userId, reason);

  // If seller cancels, rate buyer -1
  if (isSeller) {
    await Order.rateTransaction(orderId, userId, -1, reason || 'Order cancelled by seller', false);
    await Rating.create(userId, order.buyer_id, order.product_id, -1, reason || 'Order cancelled by seller');
  }

  // Notify other party
  const io = req.app.get('io');
  if (io) {
    const otherUserId = isBuyer ? order.seller_id : order.buyer_id;
    io.to(`user-${otherUserId}`).emit('order-cancelled', {
      orderId: order.id,
      cancelledBy: isBuyer ? 'buyer' : 'seller',
      reason
    });
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: updatedOrder
  });
});

/**
 * @desc    Get buyer's orders
 * @route   GET /api/v1/orders/buyer
 * @access  Private
 */
const getBuyerOrders = asyncHandler(async (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const userId = req.user.id;

  const result = await Order.getBuyerOrders(userId, page, page_size);

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  });
});

/**
 * @desc    Get seller's orders
 * @route   GET /api/v1/orders/seller
 * @access  Private
 */
const getSellerOrders = asyncHandler(async (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const userId = req.user.id;

  const result = await Order.getSellerOrders(userId, page, page_size);

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  });
});

/**
 * @desc    Create Stripe payment intent
 * @route   POST /api/v1/orders/:orderId/create-payment-intent
 * @access  Private (Buyer only)
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.buyer_id !== userId) {
    throw new ForbiddenError('Only buyer can create payment intent');
  }

  if (order.order_status !== 'pending_payment') {
    throw new BadRequestError('Order already paid or cancelled');
  }

  if (!stripe) {
    throw new BadRequestError('Stripe is not configured');
  }

  try {
    const amountVND = Math.round(parseFloat(order.total_price));
    
    // Stripe VND limits: min 10,000 VND, max 99,999.99 VND
    if (amountVND < 10000) {
      throw new BadRequestError('Số tiền thanh toán tối thiểu là 10,000 VND');
    }
    
    // Auto convert to USD if VND exceeds 99,999.99
    let currency = 'vnd';
    let amount = amountVND;
    let exchangeRate = null;
    
    if (amountVND > 9999999) { // 99,999.99 VND
      // Convert VND to USD using real-time exchange rate
      console.log(`Amount ${amountVND} VND exceeds Stripe VND limit, converting to USD...`);
      const conversion = await convertVNDtoUSDCents(amountVND);
      amount = conversion.amountCents;
      exchangeRate = conversion.rate;
      currency = 'usd';
      console.log(`Converted to ${conversion.amountUSD} USD (${amount} cents) at rate 1 USD = ${exchangeRate} VND`);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: {
        order_id: order.id,
        product_id: order.product_id,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        original_amount_vnd: amountVND, // Store original VND amount
        currency_used: currency,
        exchange_rate: exchangeRate ? exchangeRate.toString() : null
      },
      description: `Payment for ${order.product_title}`
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        currency: currency,
        displayAmount: amountVND, // Original VND amount for display
        chargedAmount: amount, // Actual charged amount in the currency used
        exchangeRate: exchangeRate // Exchange rate used (if converted to USD)
      }
    });
  } catch (stripeError) {
    console.error('Stripe error:', stripeError);
    
    // Handle specific Stripe errors
    if (stripeError.type === 'StripeCardError') {
      throw new BadRequestError(`Lỗi thẻ: ${stripeError.message}`);
    } else if (stripeError.type === 'StripeInvalidRequestError') {
      throw new BadRequestError(`Yêu cầu không hợp lệ: ${stripeError.message}`);
    } else {
      throw new BadRequestError(`Không thể tạo thanh toán: ${stripeError.message || stripeError}`);
    }
  }
});

/**
 * @desc    Confirm Stripe payment
 * @route   POST /api/v1/orders/:orderId/confirm-payment
 * @access  Private (Buyer only)
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentIntentId } = req.body;
  const userId = req.user.id;

  const order = await Order.getById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.buyer_id !== userId) {
    throw new ForbiddenError('Only buyer can confirm payment');
  }

  if (!stripe) {
    throw new BadRequestError('Stripe is not configured');
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestError('Payment not successful');
    }

    // Update order payment info
    await Order.updatePayment(orderId, {
      payment_method: 'stripe',
      payment_status: 'completed',
      payment_transaction_id: paymentIntentId
    });

    // Update order status to paid
    await Order.updateStatus(orderId, 'paid');

    // Notify seller
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${order.seller_id}`).emit('payment-received', {
        orderId: order.id,
        productId: order.product_id,
        productTitle: order.product_title,
        buyerName: order.buyer_name,
        amount: order.total_price
      });
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: await Order.getById(orderId)
    });
  } catch (stripeError) {
    console.error('Stripe verification error:', stripeError);
    throw new BadRequestError('Failed to verify payment');
  }
});

module.exports = {
  getOrderDetails,
  getOrderByProduct,
  updatePayment,
  updateShippingAddress,
  updateShipping,
  confirmDelivery,
  rateTransaction,
  cancelOrder,
  getBuyerOrders,
  getSellerOrders,
  createPaymentIntent,
  confirmPayment
};
