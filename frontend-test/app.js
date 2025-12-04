/**
 * BidHub Real-time Bidding Test Client
 * Pure JavaScript with Socket.IO
 */

const API_URL = 'http://localhost:3000/api/v1';
const SOCKET_URL = 'http://localhost:3000';

let socket = null;
let accessToken = null;
let currentProductId = null;
let currentProduct = null;
let currentUserId = null;
let currentUserName = null;
let currentOrderId = null;
let currentChatPartner = null;

// DOM Elements
const loginSection = document.getElementById('login-section');
const productSection = document.getElementById('product-section');
const biddingSection = document.getElementById('bidding-section');
const chatSection = document.getElementById('chat-section');
const connectionStatus = document.getElementById('connection-status');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const loginError = document.getElementById('login-error');

const productIdInput = document.getElementById('product-id');
const joinProductBtn = document.getElementById('join-product-btn');
const leaveProductBtn = document.getElementById('leave-product-btn');

const productTitle = document.getElementById('product-title');
const currentPrice = document.getElementById('current-price');
const totalBids = document.getElementById('total-bids');
const timeLeft = document.getElementById('time-left');
const auctionStatus = document.getElementById('auction-status');
const minBid = document.getElementById('min-bid');
const bidAmount = document.getElementById('bid-amount');
const placeBidBtn = document.getElementById('place-bid-btn');

const bidHistoryList = document.getElementById('bid-history-list');
const eventLog = document.getElementById('event-log');
const clearLogBtn = document.getElementById('clear-log-btn');

// Chat elements
const openChatBtn = document.getElementById('open-chat-btn');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const chatOrderId = document.getElementById('chat-order-id');
const chatWith = document.getElementById('chat-with');

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
googleLoginBtn.addEventListener('click', handleGoogleLogin);
joinProductBtn.addEventListener('click', handleJoinProduct);
leaveProductBtn.addEventListener('click', handleLeaveProduct);
placeBidBtn.addEventListener('click', handlePlaceBid);
clearLogBtn.addEventListener('click', () => {
    eventLog.innerHTML = '<p class="log-item log-info">Event log cleared</p>';
});

// Chat listeners
openChatBtn.addEventListener('click', openChat);
closeChatBtn.addEventListener('click', closeChat);
sendMessageBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// Login
async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showError(loginError, 'Email và password không được để trống');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    loginError.textContent = '';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        accessToken = data.data.access_token;
        currentUserId = data.data.user.id;
        currentUserName = data.data.user.full_name;
        
        logEvent('success', `Login successful: ${currentUserName}`);
        showToast('success', `Welcome, ${currentUserName}!`);

        // Connect to Socket.IO
        connectSocket();

        // Show product selection
        loginSection.style.display = 'none';
        productSection.style.display = 'block';

    } catch (error) {
        showError(loginError, error.message);
        logEvent('error', `Login failed: ${error.message}`);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login & Connect';
    }
}

// Google Login
function handleGoogleLogin() {
    // Redirect to Google OAuth
    window.location.href = `${API_URL}/auth/google`;
}

// Handle OAuth callback (parse token from URL)
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
        showError(loginError, `OAuth Error: ${error}`);
        logEvent('error', `OAuth failed: ${error}`);
        return;
    }

    if (token) {
        // Decode JWT to get user info
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            accessToken = token;
            currentUserId = payload.id;
            currentUserName = payload.full_name || payload.email;

            logEvent('success', `Google login successful: ${currentUserName}`);
            showToast('success', `Welcome, ${currentUserName}!`);

            // Connect to Socket.IO
            connectSocket();

            // Show product selection
            loginSection.style.display = 'none';
            productSection.style.display = 'block';

            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            showError(loginError, 'Failed to parse token');
            logEvent('error', 'Token parse failed');
        }
    }
}

// Connect Socket.IO
function connectSocket() {
    socket = io(SOCKET_URL, {
        auth: {
            token: accessToken
        }
    });

    socket.on('connect', () => {
        logEvent('success', `Socket connected: ${socket.id}`);
        updateConnectionStatus(true);
    });

    socket.on('disconnect', (reason) => {
        logEvent('warning', `Socket disconnected: ${reason}`);
        updateConnectionStatus(false);
    });

    socket.on('connect_error', (error) => {
        logEvent('error', `Connection error: ${error.message}`);
        showToast('error', 'Connection failed');
        updateConnectionStatus(false);
    });

    // Join user room for notifications
    socket.emit('join', `user-${currentUserId}`);

    // Bid Events
    socket.on('new-bid', handleNewBid);
    socket.on('bid-success', handleBidSuccess);
    socket.on('bid-error', handleBidError);
    socket.on('outbid', handleOutbid);
    socket.on('auction-extended', handleAuctionExtended);
    socket.on('auction-ending-soon', handleAuctionEndingSoon);
    socket.on('auction-ended', handleAuctionEnded);

    // Order & Chat Events
    socket.on('new-message', handleNewMessage);
    socket.on('payment-received', handlePaymentReceived);
    socket.on('order-shipped', handleOrderShipped);
    socket.on('delivery-confirmed', handleDeliveryConfirmed);
    socket.on('rating-received', handleRatingReceived);
    socket.on('order-cancelled', handleOrderCancelled);
}

// Join Product
async function handleJoinProduct() {
    const productId = parseInt(productIdInput.value);

    if (!productId) {
        showToast('error', 'Please enter a product ID');
        return;
    }

    joinProductBtn.disabled = true;
    joinProductBtn.textContent = 'Loading...';

    try {
        // Fetch product details
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Product not found');
        }

        currentProduct = data.data;
        currentProductId = productId;

        // Join socket room
        socket.emit('join-product', productId);
        logEvent('info', `Joined product room: ${productId}`);

        // Update UI
        displayProduct(currentProduct);
        
        // Fetch bid history
        await fetchBidHistory(productId);

        // Show bidding section
        productSection.style.display = 'none';
        biddingSection.style.display = 'block';

        // Start countdown timer
        startCountdown();

        showToast('success', 'Joined product room!');

    } catch (error) {
        showToast('error', error.message);
        logEvent('error', `Failed to join product: ${error.message}`);
    } finally {
        joinProductBtn.disabled = false;
        joinProductBtn.textContent = 'Join Product Room';
    }
}

// Leave Product
function handleLeaveProduct() {
    if (currentProductId) {
        socket.emit('leave-product', currentProductId);
        logEvent('info', `Left product room: ${currentProductId}`);
    }

    currentProductId = null;
    currentProduct = null;

    biddingSection.style.display = 'none';
    productSection.style.display = 'block';
}

// Place Auto-Bid
function handlePlaceBid() {
    const maxPrice = parseFloat(bidAmount.value);

    if (!maxPrice || maxPrice <= 0) {
        showToast('error', 'Vui lòng nhập giá tối đa hợp lệ');
        return;
    }

    if (maxPrice <= currentProduct.current_price) {
        showToast('error', `Giá tối đa phải lớn hơn giá hiện tại: ${formatCurrency(currentProduct.current_price)}`);
        return;
    }

    placeBidBtn.disabled = true;
    placeBidBtn.textContent = '⏳ Đang đặt giá tự động...';

    socket.emit('place-bid', {
        productId: currentProductId,
        maxPrice: maxPrice
    });

    logEvent('info', `Đặt giá tối đa: ${formatCurrency(maxPrice)}`);
}

// Socket Event Handlers
function handleNewBid(data) {
    const autoBidTag = data.isAutoBid ? ' 🤖 (Tự động)' : '';
    logEvent('success', `Lượt đặt giá mới: ${formatCurrency(data.currentPrice)} bởi ${data.bidder.name}${autoBidTag}`);
    
    // Update price display
    currentPrice.textContent = formatCurrency(data.currentPrice);
    totalBids.textContent = data.totalBids;
    
    // Update current product
    currentProduct.current_price = data.currentPrice;
    currentProduct.total_bids = data.totalBids;
    
    // Update minimum bid hint
    const minValidPrice = parseFloat(data.currentPrice) + parseFloat(currentProduct.bid_step);
    minBid.textContent = formatCurrency(minValidPrice);

    // Add to bid history
    addBidToHistory({
        bidder: data.bidder.name,
        price: data.currentPrice,
        timestamp: data.timestamp,
        isNew: true,
        isAutoBid: data.isAutoBid
    });

    // Show toast if extended
    if (data.wasExtended) {
        showToast('info', '⏰ Đấu giá tự động gia hạn thêm 10 phút!');
    }
}

function handleBidSuccess(data) {
    const actualBid = data.autoBid?.actualBidPlaced || data.bid.bidPrice;
    const savings = data.autoBid?.savings || 0;
    
    logEvent('success', `✅ Đấu giá tự động thành công!`);
    logEvent('success', `💰 Giá đặt thực tế: ${formatCurrency(actualBid)}`);
    
    if (savings > 0) {
        logEvent('success', `🎉 Tiết kiệm: ${formatCurrency(savings)} (Giá tối đa: ${formatCurrency(data.autoBid.maxPrice)})`);
        showToast('success', `✅ Đấu giá thành công! Bạn tiết kiệm ${formatCurrency(savings)}`, 7000);
    } else {
        showToast('success', '✅ Đấu giá tự động đã được thiết lập!');
    }
    
    bidAmount.value = '';
    placeBidBtn.disabled = false;
    placeBidBtn.textContent = '🤖 Đặt Giá Tự Động';
}

function handleBidError(data) {
    logEvent('error', `❌ Đấu giá thất bại: ${data.message} (${data.code})`);
    showToast('error', data.message, 7000);
    
    placeBidBtn.disabled = false;
    placeBidBtn.textContent = '🤖 Đặt Giá Tự Động';

    // Suggest minimum price if too low
    if ((data.code === 'MAX_PRICE_TOO_LOW' || data.code === 'MAX_PRICE_TOO_LOW_COMPETITION') && data.currentPrice) {
        const suggested = parseFloat(data.currentPrice) + parseFloat(currentProduct.bid_step);
        bidAmount.value = suggested;
        minBid.textContent = formatCurrency(suggested);
    }
}

function handleOutbid(data) {
    const maxPriceInfo = data.yourMaxPrice ? ` (Giá tối đa của bạn: ${formatCurrency(data.yourMaxPrice)})` : '';
    logEvent('warning', `⚠️ Bạn đã bị trả giá! Giá mới: ${formatCurrency(data.newPrice)}${maxPriceInfo}`);
    showToast('warning', `⚠️ Bạn đã bị trả giá! Giá mới: ${formatCurrency(data.newPrice)}`, 7000);
    
    // Play sound (optional)
    playSound('outbid');
}

function handleAuctionExtended(data) {
    logEvent('info', `⏰ Auction extended by ${data.extendedMinutes} minutes`);
    showToast('info', `⏰ Auction extended! New end time: ${formatTime(data.newEndTime)}`);
    
    currentProduct.end_time = data.newEndTime;
}

function handleAuctionEndingSoon(data) {
    logEvent('warning', `⏰ Auction ending soon: ${data.minutesLeft} min left`);
    showToast('warning', `⏰ Only ${data.minutesLeft} minutes left!`);
    
    // Play sound
    playSound('warning');
}

function handleAuctionEnded(data) {
    logEvent('info', `🏁 Auction ended - Final price: ${formatCurrency(data.finalPrice)}`);
    
    if (data.type === 'winner') {
        showToast('success', `🎉 ${data.message}`, 10000);
        
        // Fetch order for this product
        fetchOrderByProduct(currentProductId);
    } else {
        showToast('info', 'Auction has ended');
    }

    auctionStatus.textContent = 'Ended';
    auctionStatus.classList.add('ended');
    placeBidBtn.disabled = true;
    placeBidBtn.textContent = 'Auction Ended';
}

// Order & Chat Event Handlers
function handleNewMessage(data) {
    logEvent('info', `💬 New message from ${data.senderName}`);
    showToast('info', `💬 ${data.senderName}: ${data.message.message.substring(0, 50)}...`, 5000);
    
    // If chat is open and same order, add message
    if (chatSection.style.display !== 'none' && data.orderId === currentOrderId) {
        addChatMessage(data.message, false);
    }
}

function handlePaymentReceived(data) {
    logEvent('success', `💰 Payment received for order #${data.orderId}`);
    showToast('success', '💰 Buyer has paid!', 7000);
}

function handleOrderShipped(data) {
    logEvent('info', `📦 Order #${data.orderId} shipped - Tracking: ${data.trackingNumber}`);
    showToast('info', `📦 Order shipped! Tracking: ${data.trackingNumber}`, 7000);
}

function handleDeliveryConfirmed(data) {
    logEvent('success', `✅ Order #${data.orderId} delivered`);
    showToast('success', '✅ Buyer confirmed delivery!', 7000);
}

function handleRatingReceived(data) {
    const ratingText = data.rating > 0 ? '👍 Positive' : '👎 Negative';
    logEvent('info', `⭐ Rating received: ${ratingText}`);
    showToast('info', `⭐ You received a ${ratingText} rating!`, 7000);
}

function handleOrderCancelled(data) {
    logEvent('warning', `🚫 Order #${data.orderId} cancelled: ${data.reason}`);
    showToast('warning', `🚫 Order cancelled: ${data.reason}`, 10000);
}

// Fetch Order by Product

// Fetch Bid History
async function fetchBidHistory(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}/bids`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.data && data.data.length > 0) {
            bidHistoryList.innerHTML = '';
            data.data.forEach(bid => {
                addBidToHistory({
                    bidder: bid.masked_bidder_name,
                    price: bid.bid_price,
                    timestamp: bid.created_at,
                    isNew: false
                });
            });
        }
    } catch (error) {
        console.error('Failed to fetch bid history:', error);
    }
}

// Display Product
function displayProduct(product) {
    productTitle.textContent = product.title;
    currentPrice.textContent = formatCurrency(product.current_price);
    totalBids.textContent = product.total_bids || 0;
    auctionStatus.textContent = product.status === 'active' ? 'Đang đấu giá' : 'Đã kết thúc';
    
    if (product.status !== 'active') {
        auctionStatus.classList.add('ended');
        placeBidBtn.disabled = true;
        placeBidBtn.textContent = 'Đấu giá đã kết thúc';
    } else {
        placeBidBtn.textContent = '🤖 Đặt Giá Tự Động';
    }

    const minValidPrice = parseFloat(product.current_price) + parseFloat(product.bid_step);
    minBid.textContent = formatCurrency(minValidPrice);
    bidAmount.placeholder = `Ví dụ: ${formatCurrency(minValidPrice + parseFloat(product.bid_step) * 5)}`;
}

// Add Bid to History
function addBidToHistory(bid) {
    const item = document.createElement('div');
    item.className = 'history-item' + (bid.isNew ? ' new' : '') + (bid.isAutoBid ? ' auto-bid' : '');
    
    const autoBidIcon = bid.isAutoBid ? '<span class="auto-badge">🤖 Tự động</span>' : '';
    
    item.innerHTML = `
        <div>
            <span class="bidder">${bid.bidder}</span>
            ${autoBidIcon}
            <div class="time">${formatDateTime(bid.timestamp)}</div>
        </div>
        <div class="price">${formatCurrency(bid.price)}</div>
    `;

    // Remove empty state
    if (bidHistoryList.querySelector('.empty-state')) {
        bidHistoryList.innerHTML = '';
    }

    bidHistoryList.insertBefore(item, bidHistoryList.firstChild);

    // Remove 'new' class after animation
    if (bid.isNew) {
        setTimeout(() => item.classList.remove('new'), 3000);
    }
}

// Countdown Timer
let countdownInterval = null;

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        if (!currentProduct || !currentProduct.end_time) return;

        const now = new Date();
        const end = new Date(currentProduct.end_time);
        const diff = end - now;

        if (diff <= 0) {
            timeLeft.textContent = '00:00:00';
            clearInterval(countdownInterval);
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        timeLeft.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, 1000);
}

// Utility Functions
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.className = 'status connected';
        connectionStatus.querySelector('.text').textContent = 'Connected';
    } else {
        connectionStatus.className = 'status disconnected';
        connectionStatus.querySelector('.text').textContent = 'Disconnected';
    }
}

function logEvent(type, message) {
    const item = document.createElement('p');
    item.className = `log-item log-${type}`;
    item.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    eventLog.appendChild(item);
    eventLog.scrollTop = eventLog.scrollHeight;
}

function showToast(type, message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span class="icon">${icons[type]}</span>
        <span class="message">${message}</span>
    `;

    const container = document.getElementById('toast-container');
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showError(element, message) {
    element.textContent = message;
    setTimeout(() => element.textContent = '', 5000);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(value);
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN');
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function playSound(type) {
    // Optional: Add sound effects
    // const audio = new Audio(`/sounds/${type}.mp3`);
    // audio.play();
}

// Check for OAuth callback on page load
handleOAuthCallback();


// Initial log
logEvent('info', 'Application started. Please login to continue.');

// Check for OAuth callback on page load
handleOAuthCallback();

