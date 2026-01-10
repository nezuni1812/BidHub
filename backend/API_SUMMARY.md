# Bido API - Tổng hợp Endpoints

## 📋 Tổng quan

Hệ thống Bido có **4 phân hệ chính**:

1. **Public API** - Không cần authentication
2. **Bidder API** - Dành cho người đấu giá
3. **Seller API** - Dành cho người bán
4. **Admin API** - Dành cho quản trị viên

---

## 1️⃣ Public API (15 endpoints)

### Authentication (6 endpoints)

- `POST /api/v1/auth/register` - Đăng ký tài khoản mới
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/verify-otp` - Xác thực OTP
- `POST /api/v1/auth/resend-otp` - Gửi lại OTP
- `POST /api/v1/auth/refresh-token` - Làm mới access token
- `POST /api/v1/auth/logout` - Đăng xuất

### Categories (2 endpoints)

- `GET /api/v1/categories` - Lấy danh sách categories
- `GET /api/v1/categories/:id` - Xem chi tiết category

### Products (7 endpoints)

- `GET /api/v1/products/home` - Lấy sản phẩm trang chủ (ending soon, most bids, highest price)
- `GET /api/v1/products/search` - Tìm kiếm sản phẩm với filters
- `GET /api/v1/products/:id` - Xem chi tiết sản phẩm
- `GET /api/v1/products/:id/bids` - Xem lịch sử đấu giá
- `GET /api/v1/products/:id/questions` - Xem câu hỏi của sản phẩm
- `GET /api/v1/products/:id/questions/:questionId` - Xem chi tiết câu hỏi
- `GET /api/v1/products/:id/seller-rating` - Xem rating của seller

---

## 2️⃣ Bidder API (12 endpoints)

**Authentication required:** Bearer Token với role `bidder`

### Profile Management (1 endpoint)

- `GET /api/v1/bidder/profile` - Xem profile

### Bidding (2 endpoints)

- `GET /api/v1/bidder/bidding` - Danh sách sản phẩm đang đấu giá
- `GET /api/v1/bidder/won` - Danh sách sản phẩm đã thắng

### Watchlist (3 endpoints)

- `GET /api/v1/bidder/watchlist` - Xem danh sách theo dõi
- `POST /api/v1/bidder/watchlist/:productId` - Thêm vào watchlist
- `DELETE /api/v1/bidder/watchlist/:productId` - Xóa khỏi watchlist

### Questions (2 endpoints)

- `POST /api/v1/bidder/questions` - Gửi câu hỏi cho seller
- `GET /api/v1/bidder/questions` - Xem danh sách câu hỏi đã gửi

### Ratings (2 endpoints)

- `POST /api/v1/bidder/ratings` - Đánh giá seller
- `GET /api/v1/bidder/ratings` - Xem danh sách đánh giá đã gửi

### Upgrade Request (2 endpoints)

- `POST /api/v1/bidder/upgrade-request` - Gửi yêu cầu nâng cấp lên seller
- `GET /api/v1/bidder/upgrade-request` - Kiểm tra trạng thái yêu cầu

---

## 3️⃣ Seller API (15 endpoints)

**Authentication required:** Bearer Token với role `seller`

### Profile Management (1 endpoint)

- `GET /api/v1/seller/profile` - Xem profile

### Product Management (6 endpoints)

- `GET /api/v1/seller/products` - Danh sách sản phẩm của seller
- `GET /api/v1/seller/products/:id` - Chi tiết sản phẩm
- `POST /api/v1/seller/products` - Tạo sản phẩm mới
- `PUT /api/v1/seller/products/:id` - Cập nhật sản phẩm
- `DELETE /api/v1/seller/products/:id` - Xóa sản phẩm (nếu chưa có bid)
- `POST /api/v1/seller/products/:id/approve` - Tự approve sản phẩm (dev only)

### Questions Management (2 endpoints)

- `GET /api/v1/seller/questions` - Danh sách câu hỏi nhận được
- `POST /api/v1/seller/questions/:id/answer` - Trả lời câu hỏi

### Ratings Management (1 endpoint)

- `GET /api/v1/seller/ratings` - Xem danh sách đánh giá nhận được

### Denied Bidders (4 endpoints)

- `GET /api/v1/seller/denied-bidders` - Danh sách bidder bị từ chối
- `POST /api/v1/seller/products/:productId/deny/:bidderId` - Từ chối bidder đấu giá
- `POST /api/v1/seller/products/:productId/allow/:bidderId` - Cho phép bidder đấu giá lại
- `GET /api/v1/seller/products/:productId/denied-bidders` - Danh sách bidder bị từ chối của 1 sản phẩm

### Statistics (1 endpoint)

- `GET /api/v1/seller/statistics` - Thống kê của seller (tổng sản phẩm, doanh thu, rating)

---

## 4️⃣ Admin API (26 endpoints)

**Authentication required:** Bearer Token với role `admin`

### Category Management (5 endpoints)

- `GET /api/v1/admin/categories` - Danh sách categories với stats
- `GET /api/v1/admin/categories/:id` - Chi tiết category với stats
- `POST /api/v1/admin/categories` - Tạo category mới
- `PUT /api/v1/admin/categories/:id` - Cập nhật category
- `DELETE /api/v1/admin/categories/:id` - Xóa category (nếu không có product)

### Product Management (3 endpoints)

- `GET /api/v1/admin/products` - Danh sách tất cả sản phẩm (với filters)
- `GET /api/v1/admin/products/:id` - Chi tiết sản phẩm (admin view)
- `DELETE /api/v1/admin/products/:id` - Gỡ bỏ sản phẩm

### User Management (4 endpoints)

- `GET /api/v1/admin/users` - Danh sách người dùng (với filters)
- `GET /api/v1/admin/users/:id` - Chi tiết người dùng
- `PUT /api/v1/admin/users/:id` - Cập nhật người dùng
- `DELETE /api/v1/admin/users/:id` - Xóa người dùng

### Upgrade Request Management (4 endpoints)

- `GET /api/v1/admin/upgrade-requests` - Danh sách yêu cầu nâng cấp
- `GET /api/v1/admin/upgrade-requests/:id` - Chi tiết yêu cầu
- `POST /api/v1/admin/upgrade-requests/:id/approve` - Duyệt yêu cầu (bidder → seller)
- `POST /api/v1/admin/upgrade-requests/:id/reject` - Từ chối yêu cầu

### Dashboard Statistics (7 endpoints)

- `GET /api/v1/admin/dashboard/overview` - Tổng quan dashboard
- `GET /api/v1/admin/dashboard/auctions` - Thống kê đấu giá theo thời gian
- `GET /api/v1/admin/dashboard/revenue` - Thống kê doanh thu theo thời gian
- `GET /api/v1/admin/dashboard/users` - Thống kê tăng trưởng người dùng
- `GET /api/v1/admin/dashboard/top-sellers` - Top sellers theo doanh thu
- `GET /api/v1/admin/dashboard/top-bidders` - Top bidders theo hoạt động
- `GET /api/v1/admin/dashboard/categories` - Hiệu suất các categories

### Dashboard Metrics

Dashboard overview cung cấp các metrics:

- **Users:** Tổng số, phân loại theo role, người dùng mới
- **Products:** Tổng số, phân loại theo status, đấu giá mới, đấu giá đang hoạt động
- **Categories:** Tổng số categories
- **Revenue:** Tổng doanh thu theo kỳ
- **Upgrades:** Số lượng bidder nâng cấp thành seller
- **Bids:** Tổng số lượt đấu giá

---

## 5️⃣ Real-time Features (Socket.IO)

### Connection

```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "Bearer <access_token>" },
});
```

### Events

#### Client → Server

- `join-product` - Tham gia room của 1 sản phẩm
- `leave-product` - Rời room
- `place-bid` - Đặt giá đấu

#### Server → Client

- `new-bid` - Có người đặt giá mới
- `outbid` - Bị người khác trả giá cao hơn
- `auction-extended` - Đấu giá được gia hạn (< 5 phút còn lại)
- `auction-ended` - Đấu giá kết thúc
- `auction-ending-soon` - Sắp kết thúc (còn 5 phút)
- `error` - Lỗi xảy ra

---

## 📊 Tổng kết

| Phân hệ   | Số endpoints | Authentication | Role Required |
| --------- | ------------ | -------------- | ------------- |
| Public    | 15           | ❌ No          | -             |
| Bidder    | 12           | ✅ Yes         | `bidder`      |
| Seller    | 15           | ✅ Yes         | `seller`      |
| Admin     | 26           | ✅ Yes         | `admin`       |
| **TOTAL** | **68**       | -              | -             |

---

## 🔐 Authentication Flow

1. **Register:** `POST /auth/register` → Nhận OTP qua email
2. **Verify OTP:** `POST /auth/verify-otp` → Account activated
3. **Login:** `POST /auth/login` → Nhận `access_token` (15 min) và `refresh_token` (7 days)
4. **Use API:** Headers: `Authorization: Bearer <access_token>`
5. **Refresh:** `POST /auth/refresh-token` → Nhận access_token mới
6. **Logout:** `POST /auth/logout` → Xóa refresh_token

---

## 📝 Testing Guide

### Với Postman:

1. **Import collection:** `BidHub_API.postman_collection.json`
2. **Import environment:** `BidHub_Environment.postman_environment.json`
3. **Login để lấy token**
4. **Token tự động lưu vào environment variable**
5. **Test các endpoints**

### Test Accounts:

```
Admin:
- Email: admin@bidhub.com
- Password: password123

Sellers:
- Email: seller1@test.com, seller2@test.com, seller3@test.com
- Password: password123

Bidders:
- Email: bidder1@test.com, bidder2@test.com, ..., bidder5@test.com
- Password: password123
```

---

## 📚 Documentation Links

- **Swagger UI:** http://localhost:3000/api-docs
- **API README:** `API_README.md`
- **Admin API:** `ADMIN_API.md`
- **Real-time Guide:** `REALTIME_GUIDE.md`
- **Postman Collection:** `BidHub_API.postman_collection.json`

---

## 🚀 Quick Start

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Run database seeds
docker-compose exec -T postgres psql -U bidhub_user -d bidhub < database/seed.sql

# 3. Start server
npm run dev

# 4. Access API
# - REST API: http://localhost:3000/api/v1
# - Swagger: http://localhost:3000/api-docs
# - Socket.IO: ws://localhost:3000
```

---

## 🔄 API Versioning

Current version: **v1**

Base URL: `http://localhost:3000/api/v1`

---

## ⚡ Rate Limiting

- **Default:** 100 requests / 15 minutes per IP
- **Authentication:** 5 login attempts / 15 minutes per IP

---

## 📞 Support

- **Documentation:** http://localhost:3000/api-docs
- **Issues:** Check server logs
- **Email:** support@bidhub.com
