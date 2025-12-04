# 💬 Chat & Google OAuth - Frontend Test Guide

## 🆕 New Features Added

### 1. 🔐 Google OAuth Login

- Click "Đăng nhập với Google" button
- Redirects to Google account selection
- Auto-login after authorization
- No password needed!

### 2. 💬 Real-time Chat System

- Chat with seller after winning auction
- Real-time message delivery via Socket.IO
- Message history with pagination
- Typing indicator support ready

---

## 🚀 Quick Start

### Prerequisites

1. **Backend running** on `http://localhost:3000`
2. **Frontend-test running** on `http://localhost:5500` or `http://127.0.0.1:5500`

### Setup Google OAuth

#### Step 1: Configure Backend

Edit `backend/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
```

#### Step 2: Configure Google Console

Go to [Google Cloud Console](https://console.cloud.google.com/):

1. **Authorized redirect URIs:**

   ```
   http://localhost:3000/api/v1/auth/google/callback
   ```

2. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:5500
   http://127.0.0.1:5500
   ```

#### Step 3: Run Frontend

```bash
cd frontend-test

# Option 1: Live Server (VS Code)
# Right-click index.html → "Open with Live Server"

# Option 2: Python
python -m http.server 5500

# Option 3: Node.js
npx http-server -p 5500
```

---

## 🔐 Testing Google OAuth

### Flow Diagram

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser    │      │   Backend    │      │    Google    │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ 1. Click Google     │                     │
       │    Login button     │                     │
       ├────────────────────>│                     │
       │                     │                     │
       │ 2. Redirect to      │                     │
       │    /auth/google     │                     │
       │                     ├────────────────────>│
       │                     │ 3. Google login     │
       │                     │    page             │
       │<────────────────────┼─────────────────────┤
       │                     │                     │
       │ 4. User selects     │                     │
       │    Google account   │                     │
       ├─────────────────────┼────────────────────>│
       │                     │                     │
       │                     │<────────────────────┤
       │                     │ 5. Auth code        │
       │                     │                     │
       │                     │ 6. Exchange for     │
       │                     │    user profile     │
       │                     │                     │
       │<────────────────────┤                     │
       │ 7. Redirect to      │                     │
       │    oauth-callback   │                     │
       │    with JWT token   │                     │
       │                     │                     │
       │ 8. Parse token      │                     │
       │    & redirect to    │                     │
       │    index.html       │                     │
       │                     │                     │
       │ 9. Socket.IO        │                     │
       │    connection       │                     │
       ├────────────────────>│                     │
       │                     │                     │
       │ 10. Ready to bid!   │                     │
       │                     │                     │
```

### Step-by-Step Test

1. **Open** `http://localhost:5500/index.html`

2. **Click** "Đăng nhập với Google" button

3. **Select** your Google account

4. **Grant** permissions (email, profile)

5. **Auto-redirect** back to frontend

6. **Check Event Log:**

   ```
   [14:30:45] Google login successful: Your Name
   [14:30:46] Socket connected: abc123xyz
   ```

7. **Join Product** and start bidding!

---

## 💬 Testing Chat System

### Scenario 1: Win Auction → Chat Opens

#### User A (Winner):

1. Login as `bidder1@example.com`
2. Join product ID `1`
3. Place winning bid
4. Wait for auction to end
5. **"💬 Chat" button appears**
6. Click to open chat window
7. Type message: "Xin chào, khi nào gửi hàng?"
8. Press Enter or click Send
9. Message appears on right (purple)

#### User B (Seller):

1. Login as seller account
2. Check orders (or wait for notification)
3. Open chat for same order
4. See buyer's message on left (white)
5. Reply: "Tối nay gửi luôn nhé!"
6. Buyer receives message instantly

### Scenario 2: Real-time Message Delivery

```
Buyer Tab                Socket.IO               Seller Tab
    │                        │                        │
    │ Type: "Hello!"         │                        │
    ├───────────────────────>│                        │
    │                        │ new-message event      │
    │                        ├───────────────────────>│
    │                        │                        │
    │ Message appears (right)│    Message appears     │
    │                        │         (left)         │
    │                        │                        │
    │                        │<───────────────────────┤
    │                        │ Type: "Hi there!"      │
    │<───────────────────────┤                        │
    │ new-message event      │                        │
    │                        │                        │
    │ Message appears (left) │   Message appears      │
    │                        │        (right)         │
```

### Chat UI Features

#### Chat Window

- **Header:** Order ID + Chat partner name
- **Messages Area:** Scrollable, auto-scroll to bottom
- **Your Messages:** Purple bubble, aligned right
- **Their Messages:** White bubble, aligned left
- **Timestamps:** Small gray text below each message
- **Input Field:** Text box + Send button
- **Enter Key:** Press Enter to send

#### Message Types

```css
/* Your message (buyer/seller who's logged in) */
.chat-message.mine {
  justify-content: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Their message (other party) */
.chat-message.theirs {
  justify-content: flex-start;
  background: white;
  border: 1px solid #e5e7eb;
}
```

### Socket.IO Chat Events

#### Client → Server (Emitted via HTTP API)

```javascript
// Send message via POST API
POST /api/v1/chat/:orderId/messages
{
  "message": "Hello!"
}
```

#### Server → Client (Received via Socket)

```javascript
// Listen for incoming messages
socket.on("new-message", (data) => {
  console.log("New message:", data);
  // data = {
  //   orderId: 123,
  //   message: { id, message, sender_id, created_at },
  //   senderName: "John Doe"
  // }
});
```

---

## 🎯 Testing Checklist

### Google OAuth

- [ ] Click Google button → Redirects to Google
- [ ] Login with Google account → Grants permissions
- [ ] Redirects to `oauth-callback.html`
- [ ] Token parsed successfully
- [ ] Redirects to `index.html` with token
- [ ] Socket.IO connects automatically
- [ ] Can join product and bid normally
- [ ] Event log shows "Google login successful"

### Chat System

- [ ] Chat button hidden initially
- [ ] Win auction → Chat button appears
- [ ] Click chat → Opens chat window
- [ ] Order ID displayed correctly
- [ ] Partner name shown
- [ ] Load previous messages (if any)
- [ ] Type message → Appears on right
- [ ] Press Enter → Sends message
- [ ] Click Send button → Sends message
- [ ] Receive message → Appears on left instantly
- [ ] Toast notification for new message
- [ ] Event log shows chat activity
- [ ] Close chat → Returns to bidding view

### Socket.IO Events

- [ ] `join` event for user room
- [ ] `new-message` event received
- [ ] `payment-received` event (if seller)
- [ ] `order-shipped` event (if buyer)
- [ ] `delivery-confirmed` event (if seller)
- [ ] `rating-received` event (both)
- [ ] `order-cancelled` event

---

## 🐛 Troubleshooting

### Google OAuth Issues

#### Error: "redirect_uri_mismatch"

```
✅ Solution:
1. Check GOOGLE_CALLBACK_URL in .env matches exactly
2. Add to Google Console → Authorized redirect URIs
3. No trailing slash!
   ✅ http://localhost:3000/api/v1/auth/google/callback
   ❌ http://localhost:3000/api/v1/auth/google/callback/
```

#### Error: "origin_mismatch"

```
✅ Solution:
Add to Google Console → Authorized JavaScript origins:
   http://localhost:5500
   http://127.0.0.1:5500
```

#### Redirects but no token

```
✅ Check browser console for errors
✅ Check backend logs for passport errors
✅ Verify GOOGLE_CLIENT_ID and SECRET are correct
```

### Chat Issues

#### Chat button not appearing

```
✅ Did you win the auction?
✅ Check auction status = 'ended'
✅ Check event log for "Order created" message
✅ Try fetching order manually:
   GET /api/v1/orders/product/:productId
```

#### Messages not sending

```
✅ Check Socket.IO connected (green indicator)
✅ Check order ID is valid
✅ Check JWT token exists (re-login if needed)
✅ Check backend logs for chat errors
✅ Verify chat API endpoint:
   POST /api/v1/chat/:orderId/messages
```

#### Messages not receiving in real-time

```
✅ Check Socket.IO connection
✅ Verify joined user room: socket.emit('join', `user-${userId}`)
✅ Check browser console for socket events
✅ Both users must be connected to Socket.IO
✅ Backend should emit to `user-${receiverId}` room
```

#### Chat history not loading

```
✅ Check order has messages in database
✅ Verify API call:
   GET /api/v1/chat/:orderId/messages
✅ Check authorization header
✅ Look for errors in network tab
```

---

## 🔍 Debugging Tips

### Browser Console

```javascript
// Check current state
console.log("User ID:", currentUserId);
console.log("Order ID:", currentOrderId);
console.log("Chat Partner:", currentChatPartner);
console.log("Socket connected:", socket?.connected);
console.log("Access Token:", accessToken);

// Listen to all socket events
socket.onAny((eventName, ...args) => {
  console.log(`[Socket] ${eventName}:`, args);
});

// Test sending message manually
socket.emit("new-message", {
  orderId: 123,
  message: "Test message",
});
```

### Network Tab

1. Open DevTools → Network
2. Filter by "Fetch/XHR"
3. Look for:

   - `/auth/google/callback` (OAuth)
   - `/chat/:orderId/messages` (Chat)
   - `/orders/product/:productId` (Order)

4. Check request/response for errors

### WebSocket Tab

1. Open DevTools → Network
2. Filter by "WS" (WebSocket)
3. Click on Socket.IO connection
4. View "Messages" tab
5. See real-time events:

   ```
   ← new-message
   {"orderId":123,"message":{...},"senderName":"John"}

   → place-bid
   {"productId":1,"maxPrice":1500000}
   ```

---

## 📊 Expected Flow Timeline

```
Time    Event
────────────────────────────────────────────────────────────
00:00   User opens frontend-test
00:01   Click "Đăng nhập với Google"
00:02   Redirected to Google login page
00:10   User selects account & grants permissions
00:11   Redirected to oauth-callback.html with token
00:12   Token parsed, redirect to index.html
00:13   Socket.IO connects, joins user room
00:14   Product section visible
00:15   User joins product ID 1
00:16   Bidding section visible, bid history loaded
00:20   User places winning bid
00:25   Auction ends
00:26   "Order created" event in log
00:27   "💬 Chat" button appears
00:28   User clicks chat button
00:29   Chat window opens, messages loaded
00:30   User types "Hello!"
00:31   Message sent via API
00:32   Socket.IO emits to seller
00:33   Seller receives message instantly
00:35   Seller replies
00:36   Buyer receives reply instantly
```

---

## 🎉 Success Indicators

### Google OAuth Working ✅

- [ ] Smooth redirect flow
- [ ] No console errors
- [ ] User name displayed
- [ ] Socket.IO auto-connects
- [ ] Can bid immediately

### Chat Working ✅

- [ ] Button appears after winning
- [ ] Chat opens without errors
- [ ] Messages send instantly
- [ ] Messages receive in real-time
- [ ] UI updates smoothly
- [ ] No lag or delays

---

## 📝 Notes

- **OAuth Callback URL:** Must be accessible from browser
- **Socket.IO Rooms:** User must join `user-${userId}` room
- **Chat Messages:** Sent via API, received via Socket.IO
- **Real-time:** Both HTTP API and WebSocket work together
- **Mobile:** Fully responsive, works on mobile browsers

---

## 🚀 Next Steps

After testing:

1. Integrate to main React frontend
2. Add typing indicators
3. Add image/file uploads
4. Add emoji picker
5. Add read receipts
6. Add chat notifications badge
7. Add chat search/filter

---

**Happy Chatting!** 💬✨
