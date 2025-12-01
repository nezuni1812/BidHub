# Hướng dẫn Test API Create Product với Postman

## 📋 Prerequisites

1. **Server đang chạy**: `npm run dev`
2. **Database đã seed**: Có categories và user với role seller
3. **Đã login**: Có access_token của seller account

## 🔑 Bước 1: Login để lấy Access Token

### Request:

```
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

Body:
{
  "email": "seller1@example.com",
  "password": "password123"
}
```

### Response:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "role": "seller"
    }
  }
}
```

**Lưu lại `access_token`** để dùng cho request tiếp theo!

---

## 📤 Bước 2: Create Product với Upload Ảnh

### 2.1. Chuẩn bị ảnh

Chuẩn bị **4 ảnh** trên máy:

- 1 ảnh đại diện (main image) - ảnh đẹp nhất, rõ nét
- 3 ảnh phụ (additional images) - các góc khác nhau

**Yêu cầu:**

- Format: JPEG, PNG, hoặc WEBP
- Kích thước: Tối đa 5MB/ảnh
- Tên file: Không quan trọng (hệ thống tự generate tên mới)

### 2.2. Tạo Request trong Postman

#### **Method & URL:**

```
POST http://localhost:3000/api/v1/seller/products
```

#### **Headers:**

Thêm Authorization header:

```
Key: Authorization
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

_(Paste access_token từ bước 1)_

#### **Body:** Chọn `form-data`

| Key                 | Type     | Value                                                                                                                                                    |
| ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`             | Text     | `iPhone 15 Pro Max 256GB - Chính hãng VN/A`                                                                                                              |
| `description`       | Text     | `Máy mới 100% nguyên seal, chưa active, fullbox đầy đủ phụ kiện. Bảo hành chính hãng Apple 12 tháng tại các trung tâm bảo hành ủy quyền trên toàn quốc.` |
| `category_id`       | Text     | `1`                                                                                                                                                      |
| `start_price`       | Text     | `25000000`                                                                                                                                               |
| `buy_now_price`     | Text     | `35000000`                                                                                                                                               |
| `bid_step`          | Text     | `500000`                                                                                                                                                 |
| `auto_extend`       | Text     | `true`                                                                                                                                                   |
| `end_time`          | Text     | `2025-12-31T23:59:59Z`                                                                                                                                   |
| `main_image`        | **File** | _(Click "Select Files" và chọn ảnh đại diện)_                                                                                                            |
| `additional_images` | **File** | _(Click "Select Files" và chọn ảnh 1)_                                                                                                                   |
| `additional_images` | **File** | _(Click "Select Files" và chọn ảnh 2)_                                                                                                                   |
| `additional_images` | **File** | _(Click "Select Files" và chọn ảnh 3)_                                                                                                                   |

**⚠️ LƯU Ý QUAN TRỌNG:**

- Để upload nhiều file cho `additional_images`, **phải tạo 3 rows riêng biệt** với cùng key `additional_images`
- Mỗi row chọn 1 file khác nhau
- Type của image fields phải là **File**, không phải Text!

### 2.3. Screenshot hướng dẫn Postman

```
┌─────────────────────────────────────────────────────────┐
│ POST http://localhost:3000/api/v1/seller/products      │
├─────────────────────────────────────────────────────────┤
│ Headers                                                 │
│   Authorization: Bearer eyJhbG...                       │
├─────────────────────────────────────────────────────────┤
│ Body (form-data)                                        │
│                                                         │
│  ✓ title              [Text]  iPhone 15 Pro Max...     │
│  ✓ description        [Text]  Máy mới 100%...          │
│  ✓ category_id        [Text]  1                        │
│  ✓ start_price        [Text]  25000000                 │
│  ✓ buy_now_price      [Text]  35000000                 │
│  ✓ bid_step           [Text]  500000                   │
│  ✓ auto_extend        [Text]  true                     │
│  ✓ end_time           [Text]  2025-12-31T23:59:59Z     │
│  ✓ main_image         [File] 📁 iphone-main.jpg        │
│  ✓ additional_images  [File] 📁 iphone-img1.jpg        │
│  ✓ additional_images  [File] 📁 iphone-img2.jpg        │
│  ✓ additional_images  [File] 📁 iphone-img3.jpg        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.4. Click Send!

### 2.5. Success Response (201 Created)

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 123,
    "seller_id": 2,
    "category_id": 1,
    "title": "iPhone 15 Pro Max 256GB - Chính hãng VN/A",
    "description": "Máy mới 100% nguyên seal...",
    "start_price": 25000000,
    "current_price": 25000000,
    "buy_now_price": 35000000,
    "bid_step": 500000,
    "auto_extend": true,
    "end_time": "2025-12-31T23:59:59.000Z",
    "status": "active",
    "total_bids": 0,
    "images": [
      {
        "id": 1,
        "product_id": 123,
        "url": "https://pub-xxxxx.r2.dev/products/1733059200000-abc123def456.jpg",
        "is_main": true
      },
      {
        "id": 2,
        "product_id": 123,
        "url": "https://pub-xxxxx.r2.dev/products/1733059201000-def456ghi789.jpg",
        "is_main": false
      },
      {
        "id": 3,
        "product_id": 123,
        "url": "https://pub-xxxxx.r2.dev/products/1733059202000-ghi789jkl012.jpg",
        "is_main": false
      },
      {
        "id": 4,
        "product_id": 123,
        "url": "https://pub-xxxxx.r2.dev/products/1733059203000-jkl012mno345.jpg",
        "is_main": false
      }
    ]
  }
}
```

**Các URL ảnh đã được upload lên Cloudflare R2 và có thể truy cập public!**

---

## ❌ Các Lỗi Thường Gặp

### 1. Missing Images (400)

```json
{
  "success": false,
  "message": "Vui lòng upload ảnh đại diện và ít nhất 3 ảnh phụ"
}
```

**Nguyên nhân:** Thiếu `main_image` hoặc `additional_images` < 3  
**Giải pháp:** Kiểm tra đã chọn đủ 4 ảnh (1 main + 3 additional)

### 2. Invalid File Type (400)

```json
{
  "success": false,
  "message": "Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WEBP"
}
```

**Nguyên nhân:** Upload file không phải ảnh (PDF, Word, etc.)  
**Giải pháp:** Chỉ upload JPEG, PNG, hoặc WEBP

### 3. File Too Large (400)

```json
{
  "success": false,
  "message": "Kích thước file vượt quá 5MB"
}
```

**Nguyên nhân:** Ảnh > 5MB  
**Giải pháp:** Resize ảnh trước khi upload (recommend: 1000x1000px, 80% quality)

### 4. Unauthorized (401)

```json
{
  "success": false,
  "message": "Token không hợp lệ"
}
```

**Nguyên nhân:** Access token sai/hết hạn  
**Giải pháp:** Login lại để lấy token mới

### 5. Forbidden (403)

```json
{
  "success": false,
  "message": "Chỉ seller mới được tạo sản phẩm"
}
```

**Nguyên nhân:** User không có role seller  
**Giải pháp:** Đăng nhập bằng tài khoản seller

### 6. Validation Error (400)

```json
{
  "success": false,
  "errors": [
    {
      "field": "title",
      "message": "Title must be at least 10 characters"
    }
  ]
}
```

**Nguyên nhân:** Dữ liệu không hợp lệ  
**Giải pháp:** Kiểm tra từng field theo yêu cầu:

- `title`: 10-255 ký tự
- `description`: Tối thiểu 50 ký tự
- `start_price`: >= 1000
- `end_time`: Format ISO 8601

---

## 🧪 Test Cases Nên Thử

### Test Case 1: Happy Path ✅

- 1 main image + 3 additional images
- Tất cả fields hợp lệ
- Kết quả: 201 Created

### Test Case 2: Maximum Images ✅

- 1 main image + 9 additional images (max)
- Kết quả: 201 Created

### Test Case 3: Missing Main Image ❌

- Không có `main_image`, chỉ có `additional_images`
- Kết quả: 400 Bad Request

### Test Case 4: Not Enough Additional Images ❌

- 1 main image + 2 additional images (< 3)
- Kết quả: 400 Bad Request

### Test Case 5: Invalid File Format ❌

- Upload file .pdf thay vì ảnh
- Kết quả: 400 Bad Request

### Test Case 6: File Too Large ❌

- Upload ảnh 10MB
- Kết quả: 400 Bad Request

### Test Case 7: Invalid Category ❌

- `category_id = 999` (không tồn tại)
- Kết quả: 400 Bad Request (Foreign key constraint)

### Test Case 8: Past End Time ❌

- `end_time = "2020-01-01T00:00:00Z"` (quá khứ)
- Kết quả: 400 Bad Request

---

## 🔍 Verify Results

### 1. Check Database

```sql
-- Check product created
SELECT * FROM products WHERE id = 123;

-- Check images uploaded
SELECT * FROM product_images WHERE product_id = 123;
```

### 2. Check R2 Console

1. Login to Cloudflare Dashboard
2. Navigate to R2 > bidhub-images bucket
3. Browse folder `products/`
4. Verify 4 files uploaded với tên dạng: `1733059200000-abc123.jpg`

### 3. Test Image URLs

Copy URL từ response và paste vào browser:

```
https://pub-xxxxx.r2.dev/products/1733059200000-abc123.jpg
```

Ảnh phải hiển thị được!

---

## 💡 Tips & Tricks

### 1. Sử dụng Postman Environment

Tạo environment variables:

```json
{
  "base_url": "http://localhost:3000/api/v1",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "seller_id": "2"
}
```

Thay URL bằng: `{{base_url}}/seller/products`  
Thay Authorization: `Bearer {{access_token}}`

### 2. Save Request vào Collection

Click **Save** sau khi test thành công để lưu request vào collection. Tiện cho việc test lại sau này.

### 3. Use Pre-request Script để Auto Login

```javascript
// Pre-request Script
pm.sendRequest(
  {
    url: pm.environment.get("base_url") + "/auth/login",
    method: "POST",
    header: {
      "Content-Type": "application/json",
    },
    body: {
      mode: "raw",
      raw: JSON.stringify({
        email: "seller1@example.com",
        password: "password123",
      }),
    },
  },
  function (err, res) {
    if (!err) {
      const token = res.json().data.access_token;
      pm.environment.set("access_token", token);
    }
  }
);
```

### 4. Bulk Test với Newman (CLI)

```bash
npm install -g newman
newman run BidHub_API.postman_collection.json -e BidHub_Environment.postman_environment.json
```

---

## 📦 Postman Collection Export

Import vào Postman: `CreateProduct_ImageUpload_Example.postman_collection.json`

Hoặc tạo manual:

**Collection:** BidHub API  
**Folder:** Seller  
**Request:** Create Product with Images

```json
{
  "name": "Create Product with Images",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{access_token}}"
      }
    ],
    "body": {
      "mode": "formdata",
      "formdata": [
        { "key": "title", "value": "iPhone 15 Pro Max 256GB", "type": "text" },
        { "key": "description", "value": "Máy mới 100%...", "type": "text" },
        { "key": "category_id", "value": "1", "type": "text" },
        { "key": "start_price", "value": "25000000", "type": "text" },
        { "key": "buy_now_price", "value": "35000000", "type": "text" },
        { "key": "bid_step", "value": "500000", "type": "text" },
        { "key": "auto_extend", "value": "true", "type": "text" },
        { "key": "end_time", "value": "2025-12-31T23:59:59Z", "type": "text" },
        { "key": "main_image", "type": "file", "src": "/path/to/main.jpg" },
        {
          "key": "additional_images",
          "type": "file",
          "src": "/path/to/img1.jpg"
        },
        {
          "key": "additional_images",
          "type": "file",
          "src": "/path/to/img2.jpg"
        },
        {
          "key": "additional_images",
          "type": "file",
          "src": "/path/to/img3.jpg"
        }
      ]
    },
    "url": {
      "raw": "{{base_url}}/seller/products",
      "host": ["{{base_url}}"],
      "path": ["seller", "products"]
    }
  }
}
```

---

## 🎯 Summary

**Các bước tóm tắt:**

1. ✅ Login → Lấy `access_token`
2. ✅ Tạo request POST `/seller/products`
3. ✅ Add header: `Authorization: Bearer {token}`
4. ✅ Body type: `form-data`
5. ✅ Add text fields: title, description, category_id, prices, end_time
6. ✅ Add file fields:
   - `main_image` (File) - 1 ảnh
   - `additional_images` (File) - 3 rows, mỗi row 1 ảnh
7. ✅ Send request
8. ✅ Verify response có URLs ảnh từ R2

**Done! 🎉**
