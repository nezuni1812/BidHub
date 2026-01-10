# 🏆 Bido - Nền tảng Đấu giá Trực tuyến

Bido là một nền tảng đấu giá trực tuyến hiện đại, cho phép người dùng mua bán sản phẩm thông qua hệ thống đấu giá thời gian thực với tính năng tự động đấu giá, mua ngay, và thanh toán tích hợp.

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [Khởi chạy dự án](#-khởi-chạy-dự-án)
- [Triển khai Production](#-triển-khai-production)
- [API Documentation](#-api-documentation)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Tính năng

### 🔐 Authentication & Authorization

- Đăng ký/Đăng nhập với email/password
- OAuth2 với Google
- JWT authentication
- Role-based access control (Buyer/Seller/Admin)
- Email verification
- Forgot password & Reset password

### 🛍️ Đấu giá

- Tạo và quản lý sản phẩm đấu giá
- Đấu giá thời gian thực với Socket.IO
- Tự động đấu giá (Auto-bid)
- Hệ thống đếm ngược thời gian
- Lịch sử đấu giá chi tiết
- Thông báo realtime khi có người đấu giá

### 💰 Thanh toán

- Tích hợp Stripe Payment
- Mua ngay (Buy Now)
- Xử lý đơn hàng tự động
- Quản lý đơn hàng (Orders)

### 👤 Quản lý người dùng

- Profile management
- Upload avatar
- Yêu cầu nâng cấp Seller
- Đánh giá và phản hồi (Rating & Reviews)
- Watchlist sản phẩm yêu thích

### 💬 Giao tiếp

- Hỏi đáp về sản phẩm
- Real-time chat giữa người mua và người bán
- Thông báo realtime

### 🔍 Tìm kiếm & Lọc

- Tìm kiếm sản phẩm
- Lọc theo danh mục, giá, trạng thái
- Sắp xếp theo nhiều tiêu chí
- Pagination

### 📊 Monitoring & Logging

- ELK Stack (Elasticsearch, Logstash, Kibana, Filebeat)
- Winston logger
- Request/Response logging
- Error tracking
- Performance monitoring

### 🔒 Bảo mật

- Rate limiting
- Helmet security headers
- Input validation với express-validator
- SQL injection prevention
- XSS protection
- CORS configuration

---

## 🛠️ Công nghệ sử dụng

### Backend

- **Framework:** Node.js + Express.js
- **Database:** PostgreSQL
- **Cache:** Redis
- **Real-time:** Socket.IO
- **Authentication:** JWT + Passport.js (Google OAuth2)
- **Payment:** Stripe
- **Logging:** Winston + ELK Stack
- **Email:** Nodemailer
- **File Upload:** Multer + AWS S3
- **Validation:** Express Validator
- **Security:** Helmet, Rate Limiting
- **Scheduling:** Node-cron
- **Documentation:** Swagger

### Frontend

- **Framework:** React 19.2 + TypeScript
- **Build Tool:** Vite 7.2
- **Styling:** Tailwind CSS 4.1
- **UI Components:** Radix UI
- **Routing:** React Router DOM v7
- **State Management:** React Context + Hooks
- **Real-time:** Socket.IO Client
- **Rich Text Editor:** TipTap
- **Charts:** Recharts
- **Payment:** Stripe React
- **Icons:** Lucide React

### DevOps & Infrastructure

- **Container:** Docker + Docker Compose
- **Database Tools:** pgAdmin
- **Monitoring:** ELK Stack (Elasticsearch, Logstash, Kibana, Filebeat)
- **Version Control:** Git

---

## 📦 Yêu cầu hệ thống

### Phần mềm cần thiết:

1. **Node.js & npm**

   - Node.js version: >= 18.0.0
   - npm version: >= 9.0.0
   - Download: https://nodejs.org/

2. **PostgreSQL**

   - Version: >= 15.0
   - Download: https://www.postgresql.org/download/
   - **HOẶC** sử dụng Docker (khuyến nghị)

3. **Redis**

   - Version: >= 7.0
   - Download: https://redis.io/download/
   - **HOẶC** sử dụng Docker (khuyến nghị)

4. **Docker & Docker Compose** (Khuyến nghị)

   - Docker Desktop for Windows: https://www.docker.com/products/docker-desktop
   - Bao gồm: PostgreSQL, Redis, pgAdmin, ELK Stack

5. **Git**
   - Download: https://git-scm.com/downloads

### Tài khoản bên ngoài cần thiết:

- **Google Cloud Console** (cho OAuth2)
- **Stripe Account** (cho payment)
- **Cloudflare Account** (cho S3 file upload - optional)
- **SMTP Email Service** (Gmail, SendGrid, etc.)

---

## 🚀 Hướng dẫn cài đặt

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd Bido
```

### Bước 2: Cài đặt Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

### Bước 3: Khởi động Database & Services với Docker

Docker sẽ tự động khởi động:

- PostgreSQL (port 5432)
- Redis (port 6379)
- pgAdmin (port 5050)
- Elasticsearch (port 9200)
- Logstash (port 5044, 9600)
- Kibana (port 5601)
- Filebeat

```bash
cd ../backend
docker-compose up -d
```

Kiểm tra trạng thái:

```bash
docker-compose ps
```

Tất cả services phải ở trạng thái "Up" và "healthy".

### Bước 4: Khởi tạo Database

#### Option 1: Sử dụng pgAdmin (Giao diện)

1. Truy cập pgAdmin: http://localhost:5050
2. Login:

   - Email: `admin@bidhub.com`
   - Password: `admin123`

3. Kết nối PostgreSQL:

   - Right click "Servers" > Create > Server
   - General > Name: `Bido`
   - Connection:
     - Host: `postgres` (nếu trong Docker) hoặc `localhost`
     - Port: `5432`
     - Database: `auction_app`
     - Username: `auction_user`
     - Password: `auction_password`

4. Chạy SQL Scripts:
   - Click vào database `auction_app`
   - Tools > Query Tool
   - Mở và chạy theo thứ tự:
     1. `backend/database/init.sql` (Tables & Triggers)
     2. `backend/database/seed.sql` (Initial data)
     3. `backend/database/seed_categories_users.sql` (Categories & Users)
     4. `backend/database/seed_enhanced_products.sql` (Products với HTML descriptions)
     5. `backend/database/seed_bids.sql` (Bid history)

#### Option 2: Sử dụng Command Line

```bash
# Truy cập PostgreSQL container
docker exec -it bidhub-postgres psql -U auction_user -d auction_app

# Hoặc nếu PostgreSQL local
psql -U auction_user -d auction_app

# Trong psql, chạy các scripts:
\i /docker-entrypoint-initdb.d/init.sql
\i /path/to/backend/database/seed.sql
\i /path/to/backend/database/seed_categories_users.sql
\i /path/to/backend/database/seed_enhanced_products.sql
\i /path/to/backend/database/seed_bids.sql

# Thoát
\q
```

#### Option 3: Script tự động (Windows PowerShell)

```powershell
cd backend
docker exec -i bidhub-postgres psql -U auction_user -d auction_app < database/init.sql
docker exec -i bidhub-postgres psql -U auction_user -d auction_app < database/seed.sql
docker exec -i bidhub-postgres psql -U auction_user -d auction_app < database/seed_categories_users.sql
docker exec -i bidhub-postgres psql -U auction_user -d auction_app < database/seed_enhanced_products.sql
docker exec -i bidhub-postgres psql -U auction_user -d auction_app < database/seed_bids.sql
```

---

## ⚙️ Cấu hình môi trường

### Backend Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auction_app
DB_USER=auction_user
DB_PASSWORD=auction_password
DB_MAX_CONNECTIONS=20

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=30d

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Bido <noreply@bidhub.com>

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=bidhub-uploads

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Elasticsearch (Optional)
ELASTICSEARCH_HOST=http://localhost:9200
ELASTICSEARCH_LOG_LEVEL=info
```

### Frontend Environment Variables

Tạo file `.env` trong thư mục `frontend/`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# App Configuration
VITE_APP_NAME=Bido
VITE_APP_URL=http://localhost:5173
```

### Hướng dẫn lấy API Keys:

#### 1. Google OAuth2:

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. APIs & Services > Credentials
4. Create Credentials > OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `http://localhost:5173/oauth-callback` (frontend)
7. Copy Client ID và Client Secret

Chi tiết: `backend/GOOGLE_OAUTH_SETUP.md`

#### 2. Stripe:

1. Truy cập: https://dashboard.stripe.com/
2. Developers > API keys
3. Copy "Publishable key" và "Secret key"
4. Test mode cho development

#### 3. Gmail App Password (cho email):

1. Bật 2-Factor Authentication
2. Google Account > Security > App passwords
3. Tạo app password mới
4. Copy password (16 ký tự)

#### 4. AWS S3 (Optional):

1. Truy cập: https://console.aws.amazon.com/
2. IAM > Users > Create user
3. Attach policy: AmazonS3FullAccess
4. Security credentials > Create access key
5. Copy Access Key ID và Secret Access Key
6. S3 > Create bucket

---

## 🎯 Khởi chạy dự án

### Development Mode

#### 1. Khởi động Backend

```bash
cd backend

# Development với auto-reload
npm run dev

# Hoặc production mode
npm start
```

Backend sẽ chạy tại: http://localhost:3000

#### 2. Khởi động Frontend

```bash
cd frontend

# Development mode
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

#### 3. Truy cập ứng dụng

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **API Documentation:** http://localhost:3000/api-docs
- **pgAdmin:** http://localhost:5050
- **Kibana (Logs):** http://localhost:5601
- **Elasticsearch:** http://localhost:9200

### Tài khoản mẫu (từ seed data):

#### Admin:

- Email: `admin@example.com`
- Password: `password123`

#### Seller:

- Email: `seller1@example.com`
- Password: `password123`

#### Buyer:

- Email: `buyer1@example.com`
- Password: `password123`

---

## 🌐 Triển khai Production

### Build Frontend

```bash
cd frontend
npm run build
```

Build output sẽ ở thư mục `frontend/dist/`

### Build Backend

Backend không cần build (Node.js runtime).

### Environment Variables (Production)

1. Đổi `NODE_ENV=production`
2. Sử dụng database production
3. Thay đổi JWT secrets
4. Cấu hình CORS cho domain production
5. Sử dụng Stripe live keys
6. Cấu hình HTTPS
7. Set up reverse proxy (Nginx)

### Docker Production

```bash
# Build và start
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f
```

### Database Migration (Production)

1. Backup database trước
2. Chạy migration scripts
3. Test thoroughly

### Monitoring

- **Logs:** Xem trong Kibana (http://your-domain:5601)
- **Database:** pgAdmin (http://your-domain:5050)
- **API Health:** http://your-domain/api/health

---

## 📚 API Documentation

### Swagger UI

Truy cập: http://localhost:3000/api-docs

### Các API endpoints chính:

#### Authentication

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password/:token` - Reset mật khẩu

#### Products

- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/seller/products` - Tạo sản phẩm (Seller)
- `PUT /api/seller/products/:id` - Cập nhật sản phẩm
- `DELETE /api/seller/products/:id` - Xóa sản phẩm

#### Bids

- `POST /api/products/:id/bid` - Đấu giá
- `GET /api/products/:id/bids` - Lịch sử đấu giá
- `POST /api/products/:id/auto-bid` - Thiết lập tự động đấu giá

#### Orders

- `POST /api/orders/buy-now/:productId` - Mua ngay
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn hàng

#### Users

- `GET /api/users/profile` - Xem profile
- `PUT /api/users/profile` - Cập nhật profile
- `POST /api/users/upgrade-seller` - Yêu cầu nâng cấp Seller

Chi tiết: `backend/API_README.md`, `backend/API_SUMMARY.md`

---

## 📁 Cấu trúc dự án

```
Bido/
├── backend/
│   ├── database/               # SQL scripts
│   │   ├── init.sql           # Schema & triggers
│   │   ├── seed.sql           # Initial data
│   │   ├── seed_categories_users.sql
│   │   ├── seed_enhanced_products.sql
│   │   └── seed_bids.sql
│   ├── filebeat/              # Filebeat config
│   │   └── filebeat.yml
│   ├── logstash/              # Logstash config
│   │   ├── config/
│   │   └── pipeline/
│   ├── logs/                  # Application logs
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── socket/            # Socket.IO handlers
│   │   ├── utils/             # Utility functions
│   │   ├── validators/        # Input validation
│   │   └── server.js          # Entry point
│   ├── uploads/               # Uploaded files
│   ├── .env                   # Environment variables
│   ├── docker-compose.yml     # Docker services
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── app/                   # Next.js app directory
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Main app
│   │   └── main.tsx           # Entry point
│   ├── .env                   # Environment variables
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── frontend-test/             # Testing frontend
└── README.md                  # This file
```

---

## 🔧 Troubleshooting

### Backend không start

**Lỗi:** `Error: connect ECONNREFUSED ::1:5432`

**Giải pháp:**

```bash
# Kiểm tra PostgreSQL đang chạy
docker-compose ps

# Khởi động lại PostgreSQL
docker-compose restart postgres

# Kiểm tra logs
docker-compose logs postgres
```

**Lỗi:** `Error: Redis connection refused`

**Giải pháp:**

```bash
# Khởi động Redis
docker-compose restart redis

# Kiểm tra
docker exec -it bidhub-redis redis-cli ping
# Phải trả về: PONG
```

### Frontend không kết nối được Backend

**Lỗi:** `Network Error` hoặc CORS error

**Giải pháp:**

1. Kiểm tra backend đang chạy: http://localhost:3000/api/health
2. Kiểm tra CORS_ORIGIN trong backend/.env
3. Kiểm tra VITE_API_URL trong frontend/.env

### Database errors

**Lỗi:** `relation "users" does not exist`

**Giải pháp:**

```bash
# Chạy lại init.sql
docker exec -i bidhub-postgres psql -U auction_user -d auction_app < backend/database/init.sql
```

**Lỗi:** Foreign key constraint errors

**Giải pháp:** Chạy các seed scripts theo đúng thứ tự:

1. init.sql
2. seed.sql
3. seed_categories_users.sql
4. seed_enhanced_products.sql
5. seed_bids.sql

### Socket.IO không hoạt động

**Kiểm tra:**

1. Backend logs: `npm run dev` trong terminal backend
2. Browser console: F12 > Console
3. Network tab: Kiểm tra WebSocket connection

**Giải pháp:**

```javascript
// Kiểm tra VITE_SOCKET_URL trong frontend/.env
VITE_SOCKET_URL=http://localhost:3000
```

### File upload errors

**Lỗi:** `File too large`

**Giải pháp:** Tăng MAX_FILE_SIZE trong backend/.env

**Lỗi:** `Invalid file type`

**Giải pháp:** Kiểm tra ALLOWED_IMAGE_TYPES trong backend/.env

### ELK Stack không nhận logs

**Giải pháp:**

```bash
# Kiểm tra Filebeat
docker logs bidhub-filebeat

# Kiểm tra Logstash
docker logs bidhub-logstash

# Test Elasticsearch
curl http://localhost:9200/_cat/indices

# Restart ELK services
docker-compose restart elasticsearch logstash kibana filebeat
```

Chi tiết: `backend/ELK_GUIDE.md`

### Port đã được sử dụng

**Lỗi:** `Port 3000 already in use`

**Giải pháp:**

```bash
# Windows: Kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Hoặc đổi port trong .env
PORT=3001
```

---

## 📝 Scripts hữu ích

### Backend

```bash
# Development với auto-reload
npm run dev

# Production
npm start

# Run tests
npm test
```

### Frontend

```bash
# Development
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint code
npm run lint
```

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up -d --build

# Remove all data (⚠️ Careful!)
docker-compose down -v
```

### Database

```bash
# Backup database
docker exec bidhub-postgres pg_dump -U auction_user auction_app > backup.sql

# Restore database
docker exec -i bidhub-postgres psql -U auction_user -d auction_app < backup.sql

# Connect to psql
docker exec -it bidhub-postgres psql -U auction_user -d auction_app
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Support

- **Documentation:** Xem các file `*_README.md` và `*_GUIDE.md` trong thư mục backend/
- **API Docs:** http://localhost:3000/api-docs
- **Issues:** GitHub Issues

---

## 🎓 Tài liệu tham khảo

- **Backend:**

  - `backend/API_README.md` - API Documentation
  - `backend/API_SUMMARY.md` - API Summary
  - `backend/ADMIN_API.md` - Admin APIs
  - `backend/ORDER_SYSTEM_README.md` - Order System
  - `backend/REALTIME_README.md` - Real-time features
  - `backend/ROLE_UPGRADE_SYSTEM.md` - Role upgrade
  - `backend/GOOGLE_OAUTH_SETUP.md` - Google OAuth
  - `backend/ELK_GUIDE.md` - ELK Stack logging

- **Frontend:**
  - `frontend/README.md` - Frontend setup
  - `frontend/AUTHENTICATION_INTEGRATION.md` - Auth integration

---

**Happy Coding! 🚀**
