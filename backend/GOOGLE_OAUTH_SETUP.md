# 🔐 Google OAuth Setup Guide - BidHub

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn cài đặt đăng nhập Google OAuth cho BidHub backend.

---

## 🚀 Bước 1: Cài đặt Dependencies

Chạy lệnh sau trong thư mục `backend`:

```bash
npm install passport passport-google-oauth20
```

**Packages được cài đặt:**

- `passport`: ^0.7.0 - Authentication middleware
- `passport-google-oauth20`: ^2.0.0 - Google OAuth 2.0 strategy

---

## 🔧 Bước 2: Tạo Google OAuth Credentials

### 2.1. Truy cập Google Cloud Console

1. Đăng nhập vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn

### 2.2. Enable Google+ API

1. Vào **APIs & Services** → **Library**
2. Tìm kiếm **"Google+ API"**
3. Click **Enable**

### 2.3. Tạo OAuth 2.0 Client ID

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Configure consent screen (nếu chưa có):

   - User Type: **External**
   - App name: **BidHub**
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
   - Scopes: Email, Profile, OpenID
   - Test users: Thêm email của bạn

4. Tạo OAuth Client:

   - Application type: **Web application**
   - Name: **BidHub Backend**

   **Authorized JavaScript origins:**

   ```
   http://localhost:3000
   http://localhost:5173
   ```

   **Authorized redirect URIs:**

   ```
   http://localhost:3000/api/v1/auth/google/callback
   ```

5. Click **Create** và lưu lại:
   - ✅ **Client ID**: `your_client_id.apps.googleusercontent.com`
   - ✅ **Client Secret**: `your_client_secret`

---

## ⚙️ Bước 3: Cấu hình Environment Variables

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong `.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Frontend URL (để redirect sau khi login)
FRONTEND_URL=http://localhost:5173
```

---

## 🗄️ Bước 4: Cập nhật Database Schema

Chạy migration để thêm các field cần thiết cho Google OAuth:

```bash
psql -U auction_user -d auction_app -f database/google_auth_migration.sql
```

**Hoặc sử dụng DBeaver/PgAdmin**, copy và chạy nội dung file:
`database/google_auth_migration.sql`

**Schema changes:**

- ✅ Thêm column `google_id` (VARCHAR 255, UNIQUE)
- ✅ Thêm column `auth_provider` (VARCHAR 20, DEFAULT 'local')
- ✅ Thêm column `avatar_url` (TEXT)
- ✅ Cho phép `password_hash` NULL (cho Google users)
- ✅ Tạo index cho `google_id` và `auth_provider`

---

## 🏃 Bước 5: Khởi động Server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

---

## 🧪 Bước 6: Test Google OAuth

### 6.1. Test từ Browser

Mở browser và truy cập:

```
http://localhost:3000/api/v1/auth/google
```

**Luồng hoạt động:**

1. Browser redirect đến Google login page
2. Chọn tài khoản Google
3. Cho phép quyền truy cập
4. Google redirect về callback URL
5. Backend tạo/login user
6. Redirect về frontend với tokens

### 6.2. Check Frontend Redirect

Sau khi Google authentication thành công, user sẽ được redirect về:

```
http://localhost:5173/auth/google/success?access_token=xxx&refresh_token=yyy
```

### 6.3. Test API với Postman

**Step 1:** Click "Login with Google" button → Lấy `access_token`

**Step 2:** Test authenticated endpoint:

```http
GET http://localhost:3000/api/v1/auth/me
Authorization: Bearer your_access_token
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@gmail.com",
    "full_name": "Nguyen Van A",
    "role": "bidder",
    "auth_provider": "google",
    "google_id": "103847562819374628",
    "is_active": true
  }
}
```

---

## 📚 API Endpoints

### 1. Initiate Google Login

```http
GET /api/v1/auth/google
```

Redirect user đến Google consent screen

### 2. Google Callback (tự động)

```http
GET /api/v1/auth/google/callback?code=xxx
```

Xử lý callback từ Google và trả về tokens

### 3. Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

---

## 🎨 Frontend Integration

### React Example

```jsx
// Login button
const handleGoogleLogin = () => {
  window.location.href = "http://localhost:3000/api/v1/auth/google";
};

// Success page (route: /auth/google/success)
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken && refreshToken) {
      // Save tokens
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);

      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      // Login failed
      navigate("/auth/login?error=google_auth_failed");
    }
  }, [searchParams, navigate]);

  return <div>Processing Google login...</div>;
}
```

---

## 🔒 Security Notes

### Production Configuration

Khi deploy production, cập nhật:

1. **Google Cloud Console:**

   ```
   Authorized JavaScript origins:
   https://yourdomain.com

   Authorized redirect URIs:
   https://yourdomain.com/api/v1/auth/google/callback
   ```

2. **.env file:**
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

### Best Practices

- ✅ **Không commit** `.env` file vào Git
- ✅ Sử dụng **HTTPS** trong production
- ✅ Validate email domain nếu muốn chỉ cho phép email từ domain cụ thể
- ✅ Set proper CORS policies
- ✅ Rate limit authentication endpoints
- ✅ Log authentication attempts

---

## 🐛 Troubleshooting

### Issue 1: "redirect_uri_mismatch"

**Nguyên nhân:** Callback URL không khớp với Google Console

**Giải pháp:**

1. Check lại URL trong Google Console Credentials
2. Đảm bảo format chính xác: `http://localhost:3000/api/v1/auth/google/callback`
3. Không có trailing slash `/`
4. Port phải khớp

### Issue 2: "Error: Cannot find module 'passport'"

**Giải pháp:**

```bash
cd backend
npm install passport passport-google-oauth20
```

### Issue 3: Database error "column google_id does not exist"

**Giải pháp:**

```bash
psql -U auction_user -d auction_app -f database/google_auth_migration.sql
```

### Issue 4: "GOOGLE_CLIENT_ID is undefined"

**Giải pháp:**

1. Check file `.env` tồn tại trong thư mục `backend`
2. Restart server sau khi cập nhật `.env`
3. Verify biến môi trường:
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.GOOGLE_CLIENT_ID)"
   ```

---

## 📊 Database Schema

### Users Table (after migration)

| Column            | Type         | Constraints       |
| ----------------- | ------------ | ----------------- |
| id                | BIGSERIAL    | PRIMARY KEY       |
| email             | VARCHAR(255) | UNIQUE, NOT NULL  |
| password_hash     | VARCHAR(255) | NULL (for Google) |
| **google_id**     | VARCHAR(255) | UNIQUE, NULL      |
| **auth_provider** | VARCHAR(20)  | DEFAULT 'local'   |
| **avatar_url**    | TEXT         | NULL              |
| full_name         | VARCHAR(255) | NOT NULL          |
| role              | VARCHAR(20)  | DEFAULT 'bidder'  |
| is_active         | BOOLEAN      | DEFAULT true      |
| created_at        | TIMESTAMP    | DEFAULT NOW()     |

---

## 📝 Notes

1. **Auto-activation:** Google users được tự động activate (không cần verify OTP)
2. **Password:** Google users có random password hash (không dùng password login)
3. **Role:** Mặc định tất cả Google users là `bidder`
4. **Merging accounts:** Nếu email đã tồn tại, hệ thống sẽ link Google account vào user hiện tại

---

## 🎯 Testing Checklist

- [ ] Cài đặt packages thành công
- [ ] Tạo Google OAuth credentials
- [ ] Cấu hình environment variables
- [ ] Chạy database migration
- [ ] Server khởi động không lỗi
- [ ] Click "Login with Google" redirect đến Google
- [ ] Sau khi login, redirect về frontend với tokens
- [ ] Access token hoạt động với `/auth/me`
- [ ] User được tạo trong database với `auth_provider='google'`
- [ ] Email đã tồn tại vẫn login được (account merging)

---

## 📞 Support

Nếu gặp vấn đề, check:

1. Console logs trong browser (F12)
2. Server logs (`npm run dev`)
3. Database logs
4. Google Cloud Console error messages

---

**Happy Coding! 🚀**
