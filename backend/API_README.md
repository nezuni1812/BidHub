# Bido Backend API

API backend cho hệ thống đấu giá Bido sử dụng Express.js và PostgreSQL.

## 🚀 Features

### ✅ Đã hoàn thành - Phân hệ Guest (Anonymous User)

#### 1.1 Hệ thống Menu

- **GET** `/api/v1/categories` - Danh sách tất cả categories
- **GET** `/api/v1/categories/tree` - Categories dạng cây 2 cấp
- **GET** `/api/v1/categories/:id` - Chi tiết category

#### 1.2 Trang chủ

- **GET** `/api/v1/products/home` - Top 5 products:
  - Top 5 sản phẩm gần kết thúc
  - Top 5 sản phẩm có nhiều lượt ra giá nhất
  - Top 5 sản phẩm có giá cao nhất

#### 1.3 & 1.4 Danh sách & Tìm kiếm sản phẩm

- **GET** `/api/v1/products` - Search & filter với:
  - Full-text search (hỗ trợ tiếng Việt không dấu)
  - Filter theo category
  - Sort: `end_time_asc`, `end_time_desc`, `price_asc`, `price_desc`
  - Pagination
  - Highlight sản phẩm mới (trong N phút)

#### 1.5 Chi tiết sản phẩm

- **GET** `/api/v1/products/:id` - Chi tiết đầy đủ:

  - Thông tin sản phẩm
  - Tất cả hình ảnh
  - Thông tin người bán & rating
  - Người đặt giá cao nhất & rating
  - Lịch sử Q&A
  - 5 sản phẩm liên quan
  - Lịch sử bổ sung mô tả
  - Thời gian còn lại (relative time)

- **GET** `/api/v1/products/:id/bids` - Lịch sử đấu giá (masked names)

#### 1.6 Đăng ký

- **POST** `/api/v1/auth/register` - Đăng ký tài khoản

  - Validation đầy đủ
  - Mật khẩu bcrypt
  - Email không trùng
  - Gửi OTP qua email

- **POST** `/api/v1/auth/verify-otp` - Xác nhận OTP
- **POST** `/api/v1/auth/resend-otp` - Gửi lại OTP
- **POST** `/api/v1/auth/login` - Đăng nhập
  - JWT access token & refresh token

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL connection
│   │   ├── index.js         # App configuration
│   │   └── swagger.js       # API documentation
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   └── productController.js
│   ├── models/
│   │   ├── Category.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── productRoutes.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── asyncHandler.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── validators/
│   │   └── authValidator.js
│   ├── utils/
│   │   ├── email.js
│   │   ├── errors.js
│   │   ├── jwt.js
│   │   └── otp.js
│   └── server.js
├── database/
│   └── init.sql
├── .env
├── .gitignore
├── docker-compose.yml
└── package.json
```

## 🛠️ Installation

### 1. Clone & Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env` và cập nhật các giá trị:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=auction_user
DB_PASSWORD=auction_password
DB_NAME=auction_app

# JWT
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Start Database

```bash
docker-compose up -d
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Documentation

Sau khi start server, truy cập:

**Swagger UI:** http://localhost:3000/api-docs

## 🔌 API Endpoints

### Categories

```
GET    /api/v1/categories           # Get all categories
GET    /api/v1/categories/tree      # Get categories tree
GET    /api/v1/categories/:id       # Get category by ID
```

### Products

```
GET    /api/v1/products              # Search & filter products
GET    /api/v1/products/home         # Homepage data
GET    /api/v1/products/:id          # Get product detail
GET    /api/v1/products/:id/bids     # Get bid history
```

### Authentication

```
POST   /api/v1/auth/register         # Register new user
POST   /api/v1/auth/verify-otp       # Verify OTP
POST   /api/v1/auth/resend-otp       # Resend OTP
POST   /api/v1/auth/login            # Login
```

## 🔍 Example Requests

### Search Products

```bash
GET /api/v1/products?keyword=iphone&category_id=1&sort_by=price_asc&page=1&page_size=20
```

### Register User

```json
POST /api/v1/auth/register
{
  "full_name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "password123",
  "address": "123 Street, City",
  "date_of_birth": "1990-01-01"
}
```

## 🧪 Testing

```bash
# Test database connection
docker exec -it bidhub-postgres psql -U auction_user -d auction_app -c "SELECT COUNT(*) FROM users"

# Check server health
curl http://localhost:3000/api/v1/health
```

## 📝 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Native pg driver
- **Validation:** express-validator
- **Authentication:** JWT + bcrypt
- **Email:** Nodemailer
- **API Docs:** Swagger
- **Docker:** PostgreSQL + PgAdmin

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT access & refresh tokens
- ✅ OTP email verification
- ✅ Input validation & sanitization
- ✅ SQL injection protection
- ✅ CORS enabled
- ✅ Helmet security headers
- ✅ Error handling middleware

## 📊 Database

17 tables:

- users, categories, products, product_images
- bids, watchlists, product_questions, user_ratings
- upgrade_requests, denied_bidders, orders
- chat_messages, notifications, refresh_tokens
- auto_bid_configs, product_description_history
- system_settings

## 🚧 Next Steps

- [ ] Phân hệ Bidder (đấu giá, watchlist, profile)
- [ ] Phân hệ Seller (đăng sản phẩm, quản lý)
- [ ] Phân hệ Admin (dashboard, quản lý)
- [ ] Real-time bidding (Socket.io)
- [ ] Auto-bidding system
- [ ] Payment integration
- [ ] Email notifications
- [ ] Rate limiting
- [ ] Unit tests

## 📞 Support

Email: support@bidhub.com

---

Made with ❤️ by Bido Team
