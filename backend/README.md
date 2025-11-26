# BidHub Backend - Database Setup

## Cấu trúc Database đã được cải thiện

### Các cải tiến chính:

#### 1. **Constraints & Validation**

- ✅ Thêm CHECK constraints cho các trường quan trọng:
  - `users.role`: chỉ cho phép 'bidder', 'seller', 'admin'
  - `users.rating`: giới hạn từ 0-5
  - `products.status`: chỉ cho phép các trạng thái hợp lệ
  - `products.start_price`, `current_price`: phải > 0
  - `products.end_time`: phải > start_time
  - `orders.order_status`: chỉ cho phép các trạng thái hợp lệ
  - `user_ratings.score`: giới hạn từ 1-5

#### 2. **Foreign Key Actions**

- ✅ Thêm ON DELETE actions phù hợp:
  - `CASCADE`: tự động xóa dữ liệu liên quan (bids, images, questions, etc.)
  - `RESTRICT`: ngăn xóa nếu còn dữ liệu liên quan (orders, categories)
  - `SET NULL`: set NULL khi xóa (parent_category, product_id trong ratings)

#### 3. **Indexes cho Performance**

- ✅ Thêm indexes cho các trường thường query:
  - Bids: product_id, user_id, created_at
  - Products: seller_id, category_id, status, end_time
  - Orders: buyer_id, seller_id, order_status
  - Messages: order_id, created_at
  - Ratings: rated_user_id
  - Users: email, role

#### 4. **Triggers tự động**

- ✅ Tạo function và triggers để tự động update `updated_at` timestamp

#### 5. **Trường bổ sung**

- ✅ `users.is_active`: quản lý trạng thái active của user
- ✅ `chat_messages.is_read`: theo dõi tin nhắn đã đọc

## Khởi chạy Database

### 1. Start PostgreSQL với Docker Compose:

```bash
docker-compose up -d
```

### 2. Kiểm tra containers đang chạy:

```bash
docker-compose ps
```

### 3. Truy cập PgAdmin:

- URL: http://localhost:5050
- Email: admin@bidhub.com
- Password: admin123

### 4. Kết nối PostgreSQL từ PgAdmin:

- Host: postgres
- Port: 5432
- Database: auction_app
- Username: auction_user
- Password: auction_password

### 5. Dừng containers:

```bash
docker-compose down
```

### 6. Xóa toàn bộ data và restart:

```bash
docker-compose down -v
docker-compose up -d
```

## Kết nối Database từ ứng dụng

### Connection String:

```
postgresql://auction_user:auction_password@localhost:5432/auction_app
```

### Node.js (pg):

```javascript
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "auction_user",
  password: "auction_password",
  database: "auction_app",
});
```

### Prisma:

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://auction_user:auction_password@localhost:5432/auction_app"
}
```

## Các bảng trong Database

1. **categories** - Danh mục sản phẩm (có hỗ trợ parent-child)
2. **users** - Người dùng (bidder, seller, admin)
3. **products** - Sản phẩm đấu giá
4. **product_images** - Hình ảnh sản phẩm
5. **bids** - Lịch sử đấu giá
6. **watchlists** - Danh sách theo dõi
7. **product_questions** - Câu hỏi về sản phẩm
8. **user_ratings** - Đánh giá người dùng
9. **upgrade_requests** - Yêu cầu nâng cấp tài khoản
10. **denied_bidders** - Danh sách người bị từ chối đấu giá
11. **orders** - Đơn hàng
12. **chat_messages** - Tin nhắn chat

## Gợi ý cải tiến thêm

### 1. Thêm Audit Trail:

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Thêm bảng Notifications:

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Thêm Auto-Bid Configuration:

```sql
CREATE TABLE auto_bid_configs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    max_price DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);
```
