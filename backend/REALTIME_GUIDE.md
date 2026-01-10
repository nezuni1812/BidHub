# 🚀 Bido Real-time Bidding System - Complete Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Use Cases & Flows](#use-cases--flows)
4. [API Reference](#api-reference)
5. [Client Implementation](#client-implementation)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What's New?

Bido now supports **real-time bidding** with:

- ✅ Instant bid updates (no polling required)
- ✅ Distributed locking to prevent race conditions
- ✅ Auto-extend auctions when bids placed near end time
- ✅ Real-time notifications (outbid, auction ending, winner announcements)
- ✅ Background jobs for auction management

### Technology Stack

- **Socket.IO**: Bi-directional real-time communication
- **Redis**: Distributed locking and caching
- **Node-cron**: Background job scheduling
- **JWT**: Socket authentication

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/Mobile)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  REST API    │  │  WebSocket   │  │  HTTP Long   │     │
│  │  (Initial)   │  │  (Real-time) │  │  Polling     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
└─────────┼──────────────────┼─────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              HTTP Routes (REST API)                   │  │
│  │  /api/v1/products, /api/v1/bidder, etc.             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Socket.IO Server (WebSocket)               │  │
│  │  • Authentication Middleware                          │  │
│  │  • Event Handlers (place-bid, join-product)          │  │
│  │  • Room Management (product-123, user-456)           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Background Jobs (Node-cron)                   │  │
│  │  • Check ending auctions (every 1 min)               │  │
│  │  • Close ended auctions (every 5 min)                │  │
│  │  • Cleanup old data (every 10 min)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────┬─────────────────────────┘
          │                           │
          ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│   PostgreSQL     │       │      Redis       │
│   (Main Data)    │       │  (Locks/Cache)   │
└──────────────────┘       └──────────────────┘
```

### Room Architecture

```
Product Rooms (Broadcasting to watchers):
┌─────────────────────────────────────────┐
│ Room: product-123                       │
│ ├─ User A (seller - viewing)            │
│ ├─ User B (bidder - active)             │
│ ├─ User C (bidder - watching)           │
│ └─ User D (guest - viewing)             │
│                                         │
│ Events broadcasted to this room:        │
│ • new-bid                               │
│ • auction-extended                      │
│ • auction-ending-soon                   │
│ • auction-ended                         │
└─────────────────────────────────────────┘

Personal Rooms (1-to-1 notifications):
┌─────────────────────────────────────────┐
│ Room: user-456                          │
│ └─ User B (all their devices/tabs)      │
│                                         │
│ Events sent to this room:               │
│ • outbid (when someone bids higher)     │
│ • auction-ended (as winner)             │
│ • auction-ending-soon (their products)  │
└─────────────────────────────────────────┘
```

---

## 🎬 Use Cases & Flows

### Use Case 1: Normal Bidding (Sequential)

**Scenario**: Users bid one after another

```
Timeline:
14:00:00 - User A joins product page
14:00:01 - User A sees current price: 1,000,000 VND
14:00:05 - User A bids 1,100,000 VND
14:00:06 - User B sees updated price: 1,100,000 VND (real-time!)
14:00:10 - User B bids 1,200,000 VND
14:00:11 - User A gets "outbid" notification (real-time!)
```

**Flow Diagram**:

```
User A                 Server                  User B
  │                      │                      │
  │ join-product(123)    │                      │
  ├─────────────────────>│                      │
  │                      │                      │
  │ place-bid(1,100,000) │                      │
  ├─────────────────────>│                      │
  │                      │ [Lock acquired]      │
  │                      │ [Validate]           │
  │                      │ [Save to DB]         │
  │                      │ [Lock released]      │
  │                      │                      │
  │<─── bid-success ─────┤                      │
  │                      │                      │
  │                      ├─── new-bid ────────> │
  │<─── new-bid ─────────┤                      │
  │ (price: 1,100,000)   │  (price: 1,100,000) │
  │                      │                      │
  │                      │ place-bid(1,200,000) │
  │                      │<─────────────────────┤
  │                      │ [Lock acquired]      │
  │                      │ [Validate]           │
  │                      │ [Save to DB]         │
  │                      │ [Lock released]      │
  │                      │                      │
  │<─── outbid ──────────┤                      │
  │ (new: 1,200,000)     │                      │
  │                      │                      │
  │<─── new-bid ─────────┤─── new-bid ────────> │
  │ (price: 1,200,000)   │                      │
```

---

### Use Case 2: Concurrent Bidding (Race Condition)

**Scenario**: Multiple users bid at EXACT same time

```
Timeline:
14:00:00.000 - Both users see: 1,000,000 VND
14:00:00.100 - User A submits: 1,100,000 VND
14:00:00.100 - User B submits: 1,050,000 VND (SAME TIME!)

WITHOUT REDIS LOCK (❌ Problem):
- Both read current_price = 1,000,000
- Both think their bid is valid
- Both write to DB → Data corruption!
- Result: Invalid state

WITH REDIS LOCK (✅ Solution):
- User A acquires lock first
- User A updates price to 1,100,000
- User A releases lock
- User B acquires lock
- User B reads FRESH price: 1,100,000
- User B's bid (1,050,000) is rejected!
- Result: Consistent data
```

**Flow Diagram**:

```
User A                 Redis Lock              User B
  │                      │                      │
  │ place-bid(1,100,000) │ place-bid(1,050,000) │
  ├─────────────────────>│<─────────────────────┤
  │                      │                      │
  │ [Try acquire lock]   │ [Try acquire lock]   │
  │ ✅ ACQUIRED          │ ❌ LOCKED (wait)     │
  │                      │                      │
  │ [Process bid]        │                      │
  │ DB: price = 1,100K   │      [Waiting...]    │
  │                      │                      │
  │ [Release lock]       │                      │
  ├─────────────────────>│                      │
  │                      │                      │
  │                      │ ✅ ACQUIRED          │
  │                      │<─────────────────────┤
  │                      │                      │
  │                      │   [Process bid]      │
  │                      │   Read price: 1,100K │
  │                      │   Bid rejected! ❌   │
  │                      │                      │
  │                      │<─────────────────────┤
  │<─────── broadcast ───┴────── error ────────>│
```

---

### Use Case 3: Auto-extend Auction

**Scenario**: Auction auto-extends when bid placed near end time

```
Original end time: 14:00:00
Auto-extend threshold: 5 minutes (configurable by admin)
Auto-extend duration: 10 minutes (configurable by admin)

Timeline:
13:55:00 - Auction ends in 5 minutes → Warning sent
13:57:00 - User A bids → End time extended to 14:07:00
14:02:00 - Auction ends in 5 minutes → Warning sent again
14:04:00 - User B bids → End time extended to 14:14:00
14:10:00 - No more bids
14:14:01 - Auction closes → Winner announced
```

**Flow Diagram**:

```
Time        Event                     Action
────────────────────────────────────────────────────
13:55:00    Background job runs       emit('auction-ending-soon', 5 min)
            ↓
13:57:00    User A bids
            ↓
            Check: time_left < 5 min? YES
            ↓
            Extend end_time + 10 min  end_time = 14:07:00
            ↓
            Broadcast                 emit('auction-extended', {
                                        newEndTime: 14:07:00,
                                        extendedMinutes: 10
                                      })
            ↓
14:02:00    Background job runs       emit('auction-ending-soon', 5 min)
            ↓
14:04:00    User B bids
            ↓
            Check: time_left < 5 min? YES
            ↓
            Extend again              end_time = 14:14:00
            ↓
            Broadcast                 emit('auction-extended')
            ↓
14:10:00    No more bids              (waiting...)
            ↓
14:14:01    Background job runs
            ↓
            Check: end_time passed?   YES
            ↓
            Update status             status = 'completed'
            ↓
            Notify winner             emit('auction-ended', type: 'winner')
            ↓
            Notify seller             emit('auction-ended', type: 'seller')
            ↓
            Broadcast to all          emit('auction-ended', hasWinner: true)
```

---

### Use Case 4: Auction Ending & Winner Notification

**Scenario**: Complete auction lifecycle from warning to winner

```
Timeline:
13:55:00 - 30 min warning → All watchers notified
13:50:00 - 10 min warning → All watchers notified
13:55:00 - 5 min warning → All watchers notified
13:58:00 - 2 min warning → All watchers notified
13:59:00 - 1 min warning → All watchers notified
14:00:01 - Auction ends → Winner & seller notified
```

**Notification Flow**:

```
Background Job            Product Room              User Rooms
(Cron Scheduler)         (All watchers)         (Winner & Seller)
      │                       │                       │
      │ Check ending soon     │                       │
      ├──────────────────────>│                       │
      │                       │                       │
      │                   [Broadcast]                 │
      │            auction-ending-soon                │
      │              (5 min left)                     │
      │                       │                       │
      │                       │                       │
      │ Check ended           │                       │
      ├──────────────────────>│                       │
      │                       │                       │
      │                   [Update DB]                 │
      │              status = 'completed'             │
      │                       │                       │
      │                   [Broadcast]                 │
      ├──────────────────────>│──────────────────────>│
      │              auction-ended                    │
      │           (to all watchers)        (to winner & seller)
      │                       │                       │
      │                       ▼                       ▼
      │              UI: Show ended            Notification:
      │              Remove bid button         "Chúc mừng! Bạn đã thắng"
```

---

## 📡 API Reference

### Socket.IO Events

#### Client → Server Events

##### 1. `join-product`

Join a product room to receive real-time updates

**Payload**:

```javascript
socket.emit("join-product", productId);
// Example: socket.emit('join-product', 123);
```

**Response**: None (silent success)

---

##### 2. `leave-product`

Leave a product room (cleanup)

**Payload**:

```javascript
socket.emit("leave-product", productId);
```

**Response**: None

---

##### 3. `place-bid`

Submit a new bid (with distributed locking)

**Payload**:

```javascript
socket.emit("place-bid", {
  productId: 123,
  bidPrice: 1500000,
});
```

**Success Response** (`bid-success`):

```javascript
{
  bid: {
    id: 789,
    productId: 123,
    bidPrice: 1500000,
    createdAt: "2025-11-29T14:00:00.000Z"
  },
  product: {
    id: 123,
    title: "iPhone 15 Pro Max",
    currentPrice: 1500000,
    totalBids: 15
  },
  wasExtended: false
}
```

**Error Response** (`bid-error`):

```javascript
{
  message: "Giá đặt tối thiểu phải là 1,600,000 VND",
  code: "BID_TOO_LOW",
  minBid: 1600000,
  currentPrice: 1500000
}
```

**Error Codes**:

- `LOCK_FAILED`: Too many concurrent bids, retry later
- `PRODUCT_NOT_FOUND`: Product doesn't exist
- `AUCTION_NOT_ACTIVE`: Auction closed or cancelled
- `AUCTION_ENDED`: Auction time has passed
- `SELLER_CANNOT_BID`: Sellers can't bid on own products
- `BIDDER_DENIED`: User was denied by seller
- `RATING_TOO_LOW`: User rating < 80%
- `NO_RATINGS`: Unrated users not allowed (system setting)
- `BID_TOO_LOW`: Bid less than current_price + bid_step
- `INTERNAL_ERROR`: Server error

---

#### Server → Client Events

##### 1. `new-bid`

Broadcast when someone places a bid

**Payload**:

```javascript
{
  productId: 123,
  currentPrice: 1500000,
  totalBids: 15,
  bidder: {
    id: 456,
    name: "N***" // Masked name
  },
  timestamp: "2025-11-29T14:00:00.000Z",
  wasExtended: false
}
```

**UI Action**: Update price, increment bid count, add to bid history

---

##### 2. `outbid`

Notify user they were outbid (personal notification)

**Payload**:

```javascript
{
  productId: 123,
  productTitle: "iPhone 15 Pro Max",
  productImage: "https://...",
  newPrice: 1600000,
  yourPrice: 1500000,
  timestamp: "2025-11-29T14:01:00.000Z"
}
```

**UI Action**: Show toast notification, update watchlist badge

---

##### 3. `auction-extended`

Notify auto-extend happened

**Payload**:

```javascript
{
  productId: 123,
  newEndTime: "2025-11-29T14:10:00.000Z",
  extendedMinutes: 10,
  reason: "Có lượt đặt giá mới trong 5 phút cuối"
}
```

**UI Action**: Update countdown timer, show extension message

---

##### 4. `auction-ending-soon`

Warning that auction is ending

**Payload**:

```javascript
{
  productId: 123,
  productTitle: "iPhone 15 Pro Max",
  secondsLeft: 300, // 5 minutes = 300 seconds
  minutesLeft: 5,
  endTime: "2025-11-29T14:00:00.000Z",
  currentPrice: 1500000
}
```

**UI Action**: Show countdown, highlight urgency, play sound

---

##### 5. `auction-ended`

Auction has closed

**Payload (to all watchers)**:

```javascript
{
  productId: 123,
  productTitle: "iPhone 15 Pro Max",
  finalPrice: 1800000,
  startPrice: 1000000,
  totalBids: 25,
  hasWinner: true,
  winnerId: 456,
  endTime: "2025-11-29T14:00:00.000Z"
}
```

**Payload (to winner)**:

```javascript
{
  productId: 123,
  productTitle: "iPhone 15 Pro Max",
  finalPrice: 1800000,
  type: "winner",
  message: "Chúc mừng! Bạn đã thắng đấu giá...",
  sellerEmail: "seller@example.com"
}
```

**Payload (to seller)**:

```javascript
{
  productId: 123,
  productTitle: "iPhone 15 Pro Max",
  finalPrice: 1800000,
  type: "seller",
  message: "Sản phẩm đã kết thúc...",
  winnerName: "Nguyen Van A",
  winnerEmail: "winner@example.com"
}
```

**UI Action**: Disable bidding, show winner, redirect to payment

---

## 💻 Client Implementation

### React Example (Full Integration)

```javascript
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { toast } from "react-hot-toast";

function ProductDetail({ productId }) {
  const [product, setProduct] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const [bidPrice, setBidPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch initial product data (REST API)
    fetchProduct();
    fetchBidHistory();

    // 2. Connect to Socket.IO
    const token = localStorage.getItem("access_token");
    const newSocket = io("http://localhost:3000", {
      auth: { token },
    });

    setSocket(newSocket);

    // 3. Join product room
    newSocket.emit("join-product", productId);

    // 4. Listen for real-time updates
    newSocket.on("new-bid", handleNewBid);
    newSocket.on("outbid", handleOutbid);
    newSocket.on("auction-extended", handleExtended);
    newSocket.on("auction-ending-soon", handleEndingSoon);
    newSocket.on("auction-ended", handleEnded);
    newSocket.on("bid-success", handleBidSuccess);
    newSocket.on("bid-error", handleBidError);

    // 5. Cleanup on unmount
    return () => {
      newSocket.emit("leave-product", productId);
      newSocket.off("new-bid", handleNewBid);
      newSocket.off("outbid", handleOutbid);
      newSocket.off("auction-extended", handleExtended);
      newSocket.off("auction-ending-soon", handleEndingSoon);
      newSocket.off("auction-ended", handleEnded);
      newSocket.off("bid-success", handleBidSuccess);
      newSocket.off("bid-error", handleBidError);
      newSocket.disconnect();
    };
  }, [productId]);

  // Event handlers
  const handleNewBid = (data) => {
    console.log("New bid received:", data);

    // Update product price
    setProduct((prev) => ({
      ...prev,
      currentPrice: data.currentPrice,
      totalBids: data.totalBids,
    }));

    // Add to bid history
    setBidHistory((prev) => [
      {
        price: data.currentPrice,
        bidder: data.bidder.name,
        timestamp: data.timestamp,
      },
      ...prev,
    ]);

    // Show toast (optional)
    if (data.wasExtended) {
      toast.success("Đấu giá được gia hạn thêm 10 phút!");
    }
  };

  const handleOutbid = (data) => {
    toast.error(
      `Bạn đã bị vượt giá! Giá mới: ${data.newPrice.toLocaleString(
        "vi-VN"
      )} VND`
    );

    // Play sound (optional)
    const audio = new Audio("/sounds/outbid.mp3");
    audio.play();
  };

  const handleExtended = (data) => {
    setProduct((prev) => ({
      ...prev,
      endTime: data.newEndTime,
    }));

    toast.info(`Đấu giá gia hạn thêm ${data.extendedMinutes} phút`);
  };

  const handleEndingSoon = (data) => {
    toast.warning(`Còn ${data.minutesLeft} phút!`, {
      duration: 5000,
    });
  };

  const handleEnded = (data) => {
    setProduct((prev) => ({ ...prev, status: "completed" }));

    if (data.type === "winner") {
      toast.success(data.message, { duration: 10000 });
      // Redirect to payment or contact seller
    } else {
      toast.info("Đấu giá đã kết thúc");
    }
  };

  const handleBidSuccess = (data) => {
    setIsSubmitting(false);
    setBidPrice("");
    toast.success("Đặt giá thành công!");
  };

  const handleBidError = (data) => {
    setIsSubmitting(false);

    if (data.code === "LOCK_FAILED") {
      toast.error("Có nhiều người đang đấu giá, vui lòng thử lại");
    } else if (data.code === "BID_TOO_LOW") {
      toast.error(data.message);
      // Suggest minimum bid
      setBidPrice(data.minBid);
    } else {
      toast.error(data.message);
    }
  };

  // Place bid
  const placeBid = () => {
    if (!socket || !bidPrice) return;

    setIsSubmitting(true);
    socket.emit("place-bid", {
      productId: parseInt(productId),
      bidPrice: parseFloat(bidPrice),
    });
  };

  // Fetch functions
  const fetchProduct = async () => {
    const res = await fetch(`/api/v1/products/${productId}`);
    const data = await res.json();
    setProduct(data.data);
  };

  const fetchBidHistory = async () => {
    const res = await fetch(`/api/v1/products/${productId}/bids`);
    const data = await res.json();
    setBidHistory(data.data.items);
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <h1>{product.title}</h1>

      <div className="price-section">
        <h2>
          Giá hiện tại: {product.currentPrice.toLocaleString("vi-VN")} VND
        </h2>
        <p>Tổng lượt đặt giá: {product.totalBids}</p>
      </div>

      {product.status === "active" && (
        <div className="bid-section">
          <input
            type="number"
            value={bidPrice}
            onChange={(e) => setBidPrice(e.target.value)}
            placeholder="Nhập giá đặt"
            disabled={isSubmitting}
          />
          <button onClick={placeBid} disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Đặt giá"}
          </button>
        </div>
      )}

      <div className="bid-history">
        <h3>Lịch sử đấu giá</h3>
        {bidHistory.map((bid, idx) => (
          <div key={idx}>
            {bid.bidder} - {bid.price.toLocaleString("vi-VN")} VND
            <span>{new Date(bid.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing

### Manual Testing Steps

#### 1. Start Services

```bash
# Terminal 1: Start Docker (PostgreSQL + Redis)
docker-compose up

# Terminal 2: Start Node server
npm run dev
```

#### 2. Test Concurrent Bidding

```bash
# Open 2 browser tabs side by side
# Tab 1: User A (logged in as bidder1@example.com)
# Tab 2: User B (logged in as bidder2@example.com)

# Both navigate to same product
# Both enter same bid price (e.g., 1,500,000)
# Both click "Đặt giá" at EXACT same time

# Expected result:
# - One bid succeeds
# - Other bid gets error: "Giá đặt tối thiểu phải là 1,600,000 VND"
# - Both see updated price immediately
```

#### 3. Test Auto-extend

```bash
# Create product with end_time = 5 minutes from now
# Set auto_extend = true
# Wait until 4 minutes remaining
# Place a bid

# Expected result:
# - end_time extended by 10 minutes
# - All watchers receive 'auction-extended' event
# - Countdown timer updates
```

#### 4. Test Notifications

```bash
# User A places highest bid
# User B places higher bid

# Expected result:
# - User A receives 'outbid' notification
# - Both see 'new-bid' update
# - Bid history updates for both
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Socket not connecting

**Symptom**: `socket.connect_error`

**Solutions**:

- Check JWT token is valid and not expired
- Verify FRONTEND_URL in .env matches client URL
- Check Redis is running: `docker ps`
- Check server logs for authentication errors

#### 2. Bids not updating in real-time

**Symptom**: Users don't see new bids

**Solutions**:

- Verify user joined product room: Check console for "User joined product-123"
- Check socket connection: `socket.connected` should be `true`
- Inspect network tab: Should see WebSocket frames
- Check server broadcasts: Look for "[BID] Broadcast to room" in logs

#### 3. "Lock acquisition failed" error

**Symptom**: Users getting "LOCK_FAILED" errors frequently

**Solutions**:

- Check Redis connection: `redis.ping()` should succeed
- Increase lock retry attempts in `lockService.js`
- Check Redis memory: `redis-cli INFO memory`
- Verify no stale locks: `redis-cli KEYS "bid-lock:*"`

#### 4. Auction not ending automatically

**Symptom**: Auctions stay "active" after end_time

**Solutions**:

- Check cron jobs are running: Look for "[SCHEDULER]" logs
- Verify system time is correct
- Check database end_time values
- Restart server to reinitialize scheduler

---

## 📊 Performance Considerations

### Scalability

#### Horizontal Scaling (Multiple Servers)

To run multiple Node.js instances, add Redis adapter:

```javascript
// src/socket/index.js
const { createAdapter } = require("@socket.io/redis-adapter");
const { getRedisClient } = require("../services/redisClient");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    /* config */
  });

  // Redis adapter for pub/sub across servers
  const pubClient = getRedisClient();
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  // ... rest of code
}
```

#### Load Testing

Expected capacity per server:

- 5,000 concurrent WebSocket connections
- 100 bids/second with Redis locking
- <50ms latency for broadcasts

---

## 🔒 Security

### Best Practices

1. **Authentication**: JWT verified on EVERY socket connection
2. **Authorization**: User ID attached to socket, checked on every bid
3. **Rate Limiting**: Consider adding rate limits to prevent spam bids
4. **Input Validation**: All bid prices validated server-side
5. **XSS Protection**: Bid history uses masked names (no user input displayed)

---

## 📝 Next Steps

### Recommended Enhancements

1. **Email Notifications**: Integrate with email service for outbid/winner emails
2. **Push Notifications**: Add Firebase Cloud Messaging for mobile
3. **Chat System**: Add seller-bidder chat using Socket.IO
4. **Analytics**: Track bid patterns, popular times, conversion rates
5. **Admin Dashboard**: Real-time auction monitoring for admins
6. **Rate Limiting**: Prevent bid spam attacks
7. **Fallback Polling**: For clients that can't use WebSocket

---

**Documentation Version**: 1.0.0  
**Last Updated**: 2025-11-29  
**Author**: Bido Development Team
