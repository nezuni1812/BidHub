# 🎯 BidHub Real-time Bidding Test Client

Frontend đơn giản (HTML/CSS/JavaScript thuần) để test Socket.IO real-time bidding.

## 🚀 Quick Start

### 1. Start Backend Services

```bash
cd ../backend
docker-compose up -d
npm run dev
```

### 2. Open Frontend

```bash
# Mở file HTML trong browser
start index.html

# Hoặc dùng Live Server (VSCode extension)
# Click chuột phải vào index.html → "Open with Live Server"
```

### 3. Test Flow

#### A. Login

```
Email: bidder1@example.com
Password: password123
```

#### B. Join Product

```
Product ID: 1 (hoặc product ID bất kỳ trong DB)
```

#### C. Place Bids

```
1. Xem current price
2. Nhập bid amount (> current_price + bid_step)
3. Click "Place Bid"
4. Xem real-time update ngay lập tức!
```

---

## 🧪 Test Cases

### Test 1: Single User Bidding

```
1. Login với user 1
2. Join product
3. Place bid nhiều lần
4. Xem bid history update real-time
```

### Test 2: Concurrent Bidding (Race Condition)

```
1. Mở 2 browser tabs (hoặc 2 browser khác nhau)
2. Tab 1: Login user1@example.com
3. Tab 2: Login user2@example.com
4. Cả 2 join cùng 1 product
5. Cả 2 đặt giá CÙNG LÚC → Xem Redis lock hoạt động
6. Chỉ 1 bid thành công, bid kia bị reject với error
```

### Test 3: Outbid Notification

```
1. User A đặt giá cao nhất
2. User B đặt giá cao hơn
3. User A nhận notification "You were outbid"
4. Cả 2 đều thấy price update ngay lập tức
```

### Test 4: Auto-extend Auction

```
1. Tạo product với end_time = 5 phút sau
2. Set auto_extend = true
3. Đợi đến khi còn 4 phút
4. Place bid
5. Xem auction tự động gia hạn thêm 10 phút
6. Cả 2 user đều nhận thông báo "Auction extended"
```

### Test 5: Auction Ending Warnings

```
1. Tạo product với end_time = 10 phút sau
2. Đợi và xem warnings:
   - 10 min: Warning
   - 5 min: Warning
   - 2 min: Warning
   - 1 min: Warning
3. Khi hết giờ → Status = "Ended", button disabled
```

---

## 📡 Real-time Events Log

UI hiển thị tất cả Socket.IO events theo thời gian thực:

```
[14:30:25] Socket connected: abc123
[14:30:30] Joined product room: 1
[14:30:35] Placing bid: 1,500,000 VND
[14:30:36] ✅ Bid placed successfully: 1,500,000 VND
[14:30:36] New bid: 1,500,000 VND by N***
[14:31:00] ⚠️ You were outbid! New price: 1,600,000 VND
[14:35:00] ⏰ Auction ending soon: 5 min left
```

---

## 🎨 UI Features

### 1. Connection Status Indicator

- 🟢 **Green**: Connected to Socket.IO
- 🔴 **Red**: Disconnected

### 2. Real-time Price Display

- Large, prominent current price
- Total bids counter
- Countdown timer (updates every second)
- Auction status badge

### 3. Bid History

- Auto-scrolling list
- Latest bid highlighted with animation
- Shows bidder name (masked), price, timestamp

### 4. Toast Notifications

- Success: Green with ✅
- Error: Red with ❌
- Warning: Yellow with ⚠️
- Info: Blue with ℹ️

### 5. Event Log Console

- Color-coded by event type
- Timestamps
- Scrollable history
- Clear button

---

## 🔧 Configuration

### API Endpoints

```javascript
// In app.js, change these if needed:
const API_URL = "http://localhost:3000/api/v1";
const SOCKET_URL = "http://localhost:3000";
```

### Test Accounts

Tạo trong database hoặc dùng:

```sql
-- User 1
INSERT INTO users (full_name, email, password_hash, role)
VALUES ('Bidder One', 'bidder1@example.com', '$2b$10$...', 'bidder');

-- User 2
INSERT INTO users (full_name, email, password_hash, role)
VALUES ('Bidder Two', 'bidder2@example.com', '$2b$10$...', 'bidder');
```

---

## 📊 Browser DevTools

### Check WebSocket Connection

```javascript
// In browser console:
console.log("Socket connected:", socket.connected);
console.log("Socket ID:", socket.id);

// Listen to all events
socket.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args);
});
```

### Monitor Network

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Click on connection
4. View "Messages" tab to see real-time frames

---

## 🐛 Troubleshooting

### Socket not connecting?

```
1. Check backend is running: http://localhost:3000
2. Check Redis is running: docker ps | grep redis
3. Check CORS settings in backend
4. Check JWT token in browser console
```

### Bids not updating?

```
1. Check socket.connected === true
2. Verify product room joined: Check event log
3. Look for errors in event log (red messages)
4. Check backend logs for [SOCKET] messages
```

### "Minimum bid" error?

```
1. Current price + bid step = minimum valid bid
2. Enter amount >= minimum
3. Auto-suggestion will fill correct amount on error
```

---

## 📱 Mobile Testing

### Responsive Design

```
1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select mobile device
3. Test all features work on mobile
```

### Multiple Tabs

```
1. Open 2 tabs on same device
2. Login different users
3. Test concurrent bidding
```

---

## 🎯 Expected Behavior

### Success Case

```
User A                    Server                    User B
  │                         │                         │
  │ place-bid (1.5M)        │                         │
  ├────────────────────────>│                         │
  │                         │ [Lock acquired]         │
  │                         │ [Validate]              │
  │                         │ [Save to DB]            │
  │                         │                         │
  │<──── bid-success ───────┤                         │
  │                         │                         │
  │<──── new-bid ───────────┼──── new-bid ──────────> │
  │ (1.5M)                  │     (1.5M)              │
```

### Race Condition (Protected by Redis Lock)

```
User A                    Redis                     User B
  │                         │                         │
  │ place-bid (1.5M)        │  place-bid (1.4M)       │
  ├────────────────────────>│<────────────────────────┤
  │                         │                         │
  │ [Lock OK] ✅            │  [Lock FAIL] ❌          │
  │                         │                         │
  │ Process...              │      Wait...            │
  │                         │                         │
  │<──── success ───────────┤                         │
  │                         ├──── error ─────────────>│
  │                         │ "Bid too low"           │
```

---

## 🎉 Next Steps

### Enhancements

1. Add sound effects for notifications
2. Add camera/QR code for quick product join
3. Add bid confirmation modal
4. Add auto-bid feature
5. Add chat between bidder and seller

---

**Happy Testing!** 🚀
