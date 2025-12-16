# Role Upgrade System - 7-Day Temporary Seller

## Overview

Hệ thống cho phép **Bidder** yêu cầu nâng cấp lên **Seller** tạm thời trong **7 ngày**.

## Workflow

### 1. User Request (Bidder → Seller)

```
POST /api/v1/bidder/upgrade-request
```

- Bidder gửi yêu cầu nâng cấp
- Chỉ có thể có 1 pending request tại một thời điểm
- User đã là seller không thể request

### 2. Admin Approval

```
POST /api/v1/admin/upgrade-requests/:id/approve
POST /api/v1/admin/upgrade-requests/:id/reject
```

**Khi approve:**

- User role → `seller`
- `seller_until` → current_time + 7 days
- Socket.IO emit thông báo cho user

**Response:**

```json
{
  "success": true,
  "message": "Upgrade request approved successfully. User is now a seller for 7 days.",
  "data": {
    "userId": 123,
    "expiresAt": "2024-12-20T10:30:00.000Z"
  }
}
```

### 3. Automatic Degradation (After 7 Days)

**Scheduled Job:** Chạy mỗi giờ (0 \* \* \* \*)

**Logic:**

```sql
UPDATE users
SET role = 'bidder', seller_until = NULL
WHERE role = 'seller'
  AND seller_until IS NOT NULL
  AND seller_until < CURRENT_TIMESTAMP
```

**Notifications:**

- Socket.IO emit `role-changed` event
- User nhận thông báo: "Your temporary seller status has expired"

## Database Schema

### users table

```sql
CREATE TABLE users (
  ...
  role VARCHAR(20) DEFAULT 'bidder',
  seller_until TIMESTAMP NULL, -- NULL = permanent, TIMESTAMP = expires at
  ...
);
```

### upgrade_requests table

```sql
CREATE TABLE upgrade_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  processed_by BIGINT, -- admin ID
  admin_note TEXT
);
```

## Scheduled Jobs

### 1. End Auctions Job

- **Schedule:** Every 5 minutes
- **Purpose:** Close ended auctions

### 2. Cleanup Job

- **Schedule:** Every 10 minutes
- **Purpose:** Remove expired OTPs, old refresh tokens

### 3. **Seller Degradation Job** (NEW)

- **Schedule:** Every 1 hour
- **Purpose:** Degrade expired temporary sellers to bidders
- **File:** `src/jobs/auctionScheduler.js`

## Socket.IO Events

### `role-changed`

Emitted when user role is automatically changed:

```javascript
{
  userId: 123,
  oldRole: 'seller',
  newRole: 'bidder',
  reason: 'temporary_seller_expired',
  message: 'Your temporary seller status has expired...'
}
```

## API Endpoints

### Bidder APIs

- `POST /api/v1/bidder/upgrade-request` - Request upgrade
- `GET /api/v1/bidder/upgrade-request` - Check request status

### Admin APIs

- `GET /api/v1/admin/upgrade-requests` - List all pending requests
- `POST /api/v1/admin/upgrade-requests/:id/approve` - Approve request (7 days)
- `POST /api/v1/admin/upgrade-requests/:id/reject` - Reject request

## Migration

Run this SQL to add `seller_until` to existing database:

```bash
psql -U postgres -d auction_app -f backend/database/migrations/add_seller_until.sql
```

Or manually:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_until TIMESTAMP NULL;
CREATE INDEX idx_users_seller_expiration ON users(seller_until) WHERE seller_until IS NOT NULL;
```

## Testing

### 1. Test Request

```bash
curl -X POST http://localhost:3000/api/v1/bidder/upgrade-request \
  -H "Authorization: Bearer <bidder_token>"
```

### 2. Test Approval (Admin)

```bash
curl -X POST http://localhost:3000/api/v1/admin/upgrade-requests/1/approve \
  -H "Authorization: Bearer <admin_token>"
```

### 3. Verify Expiration

```sql
-- Check users with expiration
SELECT id, full_name, email, role, seller_until
FROM users
WHERE seller_until IS NOT NULL;

-- Manually trigger degradation (for testing)
UPDATE users
SET seller_until = CURRENT_TIMESTAMP - INTERVAL '1 hour'
WHERE id = 123;

-- Wait for next scheduled job run (every hour)
-- Or restart server to trigger immediately
```

### 4. Test Auto-Degradation

```javascript
// In bidHandler.js or any socket handler
// Temporarily set expiration to 5 minutes for testing:
const sellerUntil = new Date();
sellerUntil.setMinutes(sellerUntil.getMinutes() + 5); // 5 minutes instead of 7 days
```

## Important Notes

1. **Permanent Sellers:** Admin-created sellers have `seller_until = NULL` (never expire)
2. **Temporary Sellers:** Approved via request have `seller_until = timestamp`
3. **Re-request:** After degradation, user can submit new upgrade request
4. **Active Products:** User's active products are NOT affected by role change
5. **Scheduled Job:** Runs every hour, not every minute (to reduce DB load)

## Edge Cases

### User becomes seller while having active bids

- Active auto-bids continue working
- User can create new products as seller

### User degraded while having active products

- Active products continue until end_time
- User CANNOT create new products (role = bidder)
- Need new approval to create products again

### Multiple requests

- Only 1 pending request allowed at a time
- After approval/rejection, can submit new request
- Each approval grants fresh 7 days

## Monitoring

Check degradation logs:

```bash
# In server logs
[SCHEDULER] Degraded 3 expired sellers back to bidders:
  - User 45: John Doe (john@example.com)
  - User 78: Jane Smith (jane@example.com)
```

Check current temporary sellers:

```sql
SELECT
  id,
  full_name,
  email,
  seller_until,
  (seller_until - CURRENT_TIMESTAMP) as time_remaining
FROM users
WHERE role = 'seller' AND seller_until IS NOT NULL
ORDER BY seller_until ASC;
```
