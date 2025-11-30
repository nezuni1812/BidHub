# Admin API Documentation

## Overview

Tài liệu này mô tả các API dành cho Administrator trong hệ thống BidHub. Tất cả endpoints yêu cầu authentication và authorization với role `admin`.

**Base URL:** `http://localhost:3000/api/v1/admin`

**Authentication:** Bearer Token (JWT)

**Headers Required:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 4.1 Quản lý Danh mục (Category Management)

### 1. Get All Categories

Lấy danh sách tất cả categories với thống kê.

**Endpoint:** `GET /admin/categories`

**Query Parameters:**

- `page` (integer, default: 1) - Số trang
- `limit` (integer, default: 20) - Số items mỗi trang
- `search` (string) - Tìm kiếm theo tên category
- `sort` (string, default: 'name') - Sắp xếp: `name`, `created_at`, `total_products`, `total_revenue`

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Điện tử",
      "description": "Các sản phẩm điện tử",
      "parent_id": null,
      "parent_name": null,
      "total_products": 25,
      "active_products": 15,
      "ended_products": 10,
      "total_revenue": "125000000",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### 2. Get Category by ID

Xem chi tiết category với thống kê.

**Endpoint:** `GET /admin/categories/:id`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Điện tử",
    "description": "Các sản phẩm điện tử",
    "parent_id": null,
    "parent_name": null,
    "total_products": 25,
    "active_products": 15,
    "ended_products": 10,
    "total_revenue": "125000000",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. Create Category

Tạo category mới.

**Endpoint:** `POST /admin/categories`

**Request Body:**

```json
{
  "name": "Thời trang",
  "description": "Quần áo, giày dép, phụ kiện"
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 10,
    "name": "Thời trang",
    "description": "Quần áo, giày dép, phụ kiện",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error 400:** Tên category đã tồn tại

```json
{
  "success": false,
  "message": "Category name already exists"
}
```

---

### 4. Update Category

Cập nhật thông tin category.

**Endpoint:** `PUT /admin/categories/:id`

**Request Body:**

```json
{
  "name": "Điện tử & Công nghệ",
  "description": "Các sản phẩm điện tử và công nghệ"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": 1,
    "name": "Điện tử & Công nghệ",
    "description": "Các sản phẩm điện tử và công nghệ",
    "updated_at": "2024-01-15T10:35:00Z"
  }
}
```

---

### 5. Delete Category

Xóa category (chỉ khi không có sản phẩm).

**Endpoint:** `DELETE /admin/categories/:id`

**Response 200:**

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error 400:** Category có sản phẩm

```json
{
  "success": false,
  "message": "Cannot delete category with 15 product(s). Please move or delete products first."
}
```

---

## 4.2 Quản lý Sản phẩm (Product Management)

### 1. Get All Products

Lấy danh sách tất cả sản phẩm với filters.

**Endpoint:** `GET /admin/products`

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `status` (string) - Filter: `pending`, `approved`, `active`, `ended`, `removed`
- `category_id` (integer) - Filter theo category
- `seller_id` (integer) - Filter theo seller
- `search` (string) - Tìm kiếm title/description
- `sort` (string, default: 'created_at') - `created_at`, `name`, `current_price`, `end_time`, `bid_count`
- `order` (string, default: 'DESC') - `ASC` hoặc `DESC`

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "title": "iPhone 15 Pro Max",
      "status": "active",
      "starting_price": "25000000",
      "current_price": "28000000",
      "buy_now_price": "35000000",
      "bid_step": "500000",
      "total_bids": 15,
      "start_time": "2024-01-10T00:00:00Z",
      "end_time": "2024-01-20T23:59:59Z",
      "seller_id": 5,
      "seller_name": "Nguyễn Văn Bán",
      "seller_email": "seller1@test.com",
      "category_name": "Điện tử",
      "main_image": "https://example.com/iphone.jpg",
      "created_at": "2024-01-05T10:00:00Z",
      "updated_at": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 2. Get Product by ID

Xem chi tiết đầy đủ sản phẩm.

**Endpoint:** `GET /admin/products/:id`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 100,
    "title": "iPhone 15 Pro Max",
    "description": "Máy mới 100%, fullbox, bảo hành 12 tháng",
    "status": "active",
    "starting_price": "25000000",
    "current_price": "28000000",
    "buy_now_price": "35000000",
    "bid_step": "500000",
    "total_bids": 15,
    "start_time": "2024-01-10T00:00:00Z",
    "end_time": "2024-01-20T23:59:59Z",
    "seller_id": 5,
    "seller_name": "Nguyễn Văn Bán",
    "seller_email": "seller1@test.com",
    "seller_rating": 4.85,
    "category_name": "Điện tử",
    "images": [
      {
        "id": 1,
        "url": "https://example.com/iphone-1.jpg",
        "is_main": true
      },
      {
        "id": 2,
        "url": "https://example.com/iphone-2.jpg",
        "is_main": false
      }
    ],
    "recent_bids": [
      {
        "id": 500,
        "user_id": 10,
        "bidder_name": "Phạm Văn Mua",
        "bid_price": "28000000",
        "is_auto": false,
        "created_at": "2024-01-15T14:30:00Z"
      }
    ],
    "created_at": "2024-01-05T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

---

### 3. Remove Product

Gỡ bỏ sản phẩm (admin action).

**Endpoint:** `DELETE /admin/products/:id`

**Request Body (optional):**

```json
{
  "reason": "Vi phạm chính sách đấu giá"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Product removed successfully"
}
```

**Note:** Sản phẩm sẽ được chuyển status sang `removed`, không xóa hoàn toàn khỏi database.

---

## 4.3 Quản lý Người dùng (User Management)

### 1. Get All Users

Lấy danh sách tất cả người dùng.

**Endpoint:** `GET /admin/users`

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `role` (string) - Filter: `bidder`, `seller`, `admin`
- `is_active` (string) - Filter: `'true'`, `'false'`
- `search` (string) - Tìm kiếm theo tên hoặc email
- `sort` (string, default: 'created_at') - `created_at`, `full_name`, `email`, `rating`
- `order` (string, default: 'DESC')

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "role": "bidder",
      "full_name": "Phạm Văn Mua",
      "email": "bidder1@test.com",
      "address": "111 Trần Hưng Đạo, Q5, HCM",
      "date_of_birth": "1995-03-15",
      "rating": 4.2,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-10T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

---

### 2. Get User by ID

Xem chi tiết người dùng với thống kê.

**Endpoint:** `GET /admin/users/:id`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 10,
    "role": "bidder",
    "full_name": "Phạm Văn Mua",
    "email": "bidder1@test.com",
    "address": "111 Trần Hưng Đạo, Q5, HCM",
    "date_of_birth": "1995-03-15",
    "rating": 4.2,
    "is_active": true,
    "total_products": 0,
    "total_bids": 45,
    "watchlist_count": 12,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-10T00:00:00Z"
  }
}
```

---

### 3. Update User

Cập nhật thông tin người dùng.

**Endpoint:** `PUT /admin/users/:id`

**Request Body:**

```json
{
  "full_name": "Phạm Văn Mua Updated",
  "email": "new-email@test.com",
  "role": "seller",
  "is_active": false,
  "address": "New Address",
  "date_of_birth": "1995-03-15"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 10,
    "role": "seller",
    "full_name": "Phạm Văn Mua Updated",
    "email": "new-email@test.com",
    "is_active": false,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error 400:** Email đã tồn tại

```json
{
  "success": false,
  "message": "Email already in use"
}
```

---

### 4. Delete User

Xóa người dùng.

**Endpoint:** `DELETE /admin/users/:id`

**Response 200:**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error 400:** Không thể xóa

```json
{
  "success": false,
  "message": "Cannot delete your own account"
}
```

```json
{
  "success": false,
  "message": "Cannot delete admin users"
}
```

---

## 4.3.1 Quản lý Yêu cầu Nâng cấp (Upgrade Request Management)

### 1. Get All Upgrade Requests

Lấy danh sách yêu cầu nâng cấp bidder → seller.

**Endpoint:** `GET /admin/upgrade-requests`

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `status` (string, default: 'pending') - `pending`, `approved`, `rejected`
- `sort` (string, default: 'created_at') - `created_at`, `updated_at`
- `order` (string, default: 'DESC')

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "user_id": 20,
      "status": "pending",
      "full_name": "Trần Văn Test",
      "email": "test@bidder.com",
      "rating": 4.5,
      "user_created_at": "2024-01-01T00:00:00Z",
      "total_bids": 50,
      "auctions_won": 10,
      "created_at": "2024-01-15T10:00:00Z",
      "processed_at": null,
      "admin_note": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

---

### 2. Get Upgrade Request by ID

Xem chi tiết yêu cầu nâng cấp.

**Endpoint:** `GET /admin/upgrade-requests/:id`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "user_id": 20,
    "status": "pending",
    "full_name": "Trần Văn Test",
    "email": "test@bidder.com",
    "rating": 4.5,
    "address": "123 Test Street",
    "date_of_birth": "1990-01-01",
    "user_created_at": "2024-01-01T00:00:00Z",
    "total_bids": 50,
    "auctions_won": 10,
    "total_spent": "150000000",
    "requested_at": "2024-01-15T10:00:00Z",
    "processed_at": null,
    "admin_note": null
  }
}
```

---

### 3. Approve Upgrade Request

Duyệt nâng cấp tài khoản bidder → seller.

**Endpoint:** `POST /admin/upgrade-requests/:id/approve`

**Response 200:**

```json
{
  "success": true,
  "message": "Upgrade request approved successfully. User is now a seller."
}
```

**Error 400:**

```json
{
  "success": false,
  "message": "Request is already approved"
}
```

---

### 4. Reject Upgrade Request

Từ chối yêu cầu nâng cấp.

**Endpoint:** `POST /admin/upgrade-requests/:id/reject`

**Request Body (optional):**

```json
{
  "reason": "Chưa đủ điều kiện để trở thành seller"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Upgrade request rejected"
}
```

---

## 4.4 Admin Dashboard

### 1. Dashboard Overview

Lấy tổng quan thống kê cho dashboard.

**Endpoint:** `GET /admin/dashboard/overview`

**Query Parameters:**

- `period` (string, default: '30d') - `7d`, `30d`, `90d`, `1y`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "users": {
      "total": 500,
      "by_role": {
        "admin": 2,
        "seller": 50,
        "bidder": 448
      },
      "new_users": 25
    },
    "products": {
      "total": 250,
      "by_status": {
        "pending": 10,
        "approved": 5,
        "active": 80,
        "ended": 150,
        "removed": 5
      },
      "new_auctions": 35,
      "active_auctions": 80
    },
    "categories": {
      "total": 15
    },
    "revenue": {
      "total": 1500000000,
      "period": "30 days"
    },
    "upgrades": {
      "approved": 8,
      "period": "30 days"
    },
    "bids": {
      "total": 1250,
      "period": "30 days"
    }
  }
}
```

---

### 2. Auction Statistics

Thống kê số lượng đấu giá theo thời gian (chart data).

**Endpoint:** `GET /admin/dashboard/auctions`

**Query Parameters:**

- `period` (string, default: '30d') - `7d`, `30d`, `90d`, `1y`
- `interval` (string, default: 'day') - `day`, `week`, `month`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "interval": "day",
    "chart_data": [
      {
        "period": "2024-01-01",
        "total_auctions": 15,
        "active_auctions": 10,
        "ended_auctions": 5
      },
      {
        "period": "2024-01-02",
        "total_auctions": 20,
        "active_auctions": 15,
        "ended_auctions": 5
      }
    ]
  }
}
```

---

### 3. Revenue Statistics

Thống kê doanh thu theo thời gian (chart data).

**Endpoint:** `GET /admin/dashboard/revenue`

**Query Parameters:**

- `period` (string, default: '30d')
- `interval` (string, default: 'day')

**Response 200:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "interval": "day",
    "chart_data": [
      {
        "period": "2024-01-01",
        "total_sales": 10,
        "revenue": 50000000
      },
      {
        "period": "2024-01-02",
        "total_sales": 15,
        "revenue": 75000000
      }
    ]
  }
}
```

---

### 4. User Growth Statistics

Thống kê tăng trưởng người dùng (chart data).

**Endpoint:** `GET /admin/dashboard/users`

**Query Parameters:**

- `period` (string, default: '30d')
- `interval` (string, default: 'day')

**Response 200:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "interval": "day",
    "chart_data": [
      {
        "period": "2024-01-01",
        "total_users": 10,
        "bidders": 8,
        "sellers": 2
      },
      {
        "period": "2024-01-02",
        "total_users": 15,
        "bidders": 12,
        "sellers": 3
      }
    ]
  }
}
```

---

### 5. Top Sellers

Xem top sellers theo doanh thu.

**Endpoint:** `GET /admin/dashboard/top-sellers`

**Query Parameters:**

- `period` (string, default: '30d')
- `limit` (integer, default: 10)

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "full_name": "Nguyễn Văn Bán",
      "email": "seller1@test.com",
      "rating": 4.85,
      "total_auctions": 25,
      "total_revenue": 250000000
    },
    {
      "id": 6,
      "full_name": "Trần Thị Shop",
      "email": "seller2@test.com",
      "rating": 4.5,
      "total_auctions": 20,
      "total_revenue": 180000000
    }
  ]
}
```

---

### 6. Top Bidders

Xem top bidders theo hoạt động.

**Endpoint:** `GET /admin/dashboard/top-bidders`

**Query Parameters:**

- `period` (string, default: '30d')
- `limit` (integer, default: 10)

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "full_name": "Phạm Văn Mua",
      "email": "bidder1@test.com",
      "rating": 4.2,
      "total_bids": 150,
      "auctions_won": 10,
      "total_spent": 120000000
    },
    {
      "id": 11,
      "full_name": "Hoàng Thị Đấu",
      "email": "bidder2@test.com",
      "rating": 4.7,
      "total_bids": 120,
      "auctions_won": 8,
      "total_spent": 95000000
    }
  ]
}
```

---

### 7. Category Performance

Thống kê hiệu suất các categories.

**Endpoint:** `GET /admin/dashboard/categories`

**Query Parameters:**

- `period` (string, default: '30d')

**Response 200:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "categories": [
      {
        "id": 1,
        "name": "Điện tử",
        "total_products": 50,
        "products_ended": 30,
        "total_bids": 500,
        "revenue": 500000000
      },
      {
        "id": 2,
        "name": "Thời trang",
        "total_products": 40,
        "products_ended": 25,
        "total_bids": 350,
        "revenue": 300000000
      }
    ]
  }
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Category not found"
}
```

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "name",
      "message": "Category name is required"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Testing với Postman

1. **Login as Admin:**

   ```
   POST /api/v1/auth/login
   {
     "email": "admin@bidhub.com",
     "password": "password123"
   }
   ```

2. **Lấy access_token từ response**

3. **Thêm vào Headers:**

   ```
   Authorization: Bearer <access_token>
   ```

4. **Test các endpoints admin**

---

## Summary

Tổng cộng **26 endpoints** cho Admin:

- **Category Management:** 5 endpoints (CRUD + list)
- **Product Management:** 3 endpoints (list, detail, remove)
- **User Management:** 4 endpoints (CRUD)
- **Upgrade Requests:** 4 endpoints (list, detail, approve, reject)
- **Dashboard:** 7 endpoints (overview, auctions, revenue, users, top sellers, top bidders, categories)

Tất cả endpoints đều:

- ✅ Có authentication (JWT)
- ✅ Có authorization (admin role only)
- ✅ Có validation (Joi)
- ✅ Có error handling
- ✅ Có pagination (cho list endpoints)
- ✅ Có Swagger documentation
