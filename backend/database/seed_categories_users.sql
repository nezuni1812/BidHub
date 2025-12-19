-- ================================================
-- SEED DATA - CATEGORIES & USERS ONLY
-- ================================================

-- ================================================
-- 1. CATEGORIES (2-level hierarchy)
-- ================================================
-- Parent categories (level 1)
INSERT INTO
    categories (id, name, parent_id)
VALUES (1, 'Điện tử', NULL),
    (2, 'Thời trang', NULL),
    (3, 'Đồ gia dụng', NULL),
    (4, 'Xe cộ', NULL),
    (5, 'Bất động sản', NULL),
    (
        6,
        'Sưu tầm & Nghệ thuật',
        NULL
    ),
    (7, 'Thể thao & Du lịch', NULL),
    (
        8,
        'Sách & Văn phòng phẩm',
        NULL
    );

-- Sub categories (level 2)
-- Điện tử
INSERT INTO
    categories (id, name, parent_id)
VALUES (9, 'Điện thoại', 1),
    (10, 'Laptop', 1),
    (11, 'Máy tính bảng', 1),
    (12, 'Phụ kiện điện tử', 1),
    (13, 'Máy ảnh & Quay phim', 1),
    (14, 'Tivi & Âm thanh', 1);

-- Thời trang
INSERT INTO
    categories (id, name, parent_id)
VALUES (15, 'Đồng hồ', 2),
    (16, 'Túi xách', 2),
    (17, 'Giày dép', 2),
    (18, 'Quần áo nam', 2),
    (19, 'Quần áo nữ', 2),
    (20, 'Trang sức', 2);

-- Đồ gia dụng
INSERT INTO
    categories (id, name, parent_id)
VALUES (21, 'Nội thất', 3),
    (22, 'Thiết bị nhà bếp', 3),
    (23, 'Đồ trang trí', 3);

-- Xe cộ
INSERT INTO
    categories (id, name, parent_id)
VALUES (24, 'Ô tô', 4),
    (25, 'Xe máy', 4),
    (26, 'Xe đạp', 4),
    (27, 'Phụ tùng xe', 4);

-- Sưu tầm & Nghệ thuật
INSERT INTO
    categories (id, name, parent_id)
VALUES (28, 'Tranh & Tượng', 6),
    (29, 'Tem & Tiền cổ', 6),
    (30, 'Đồ cổ', 6),
    (31, 'Đồ chơi sưu tầm', 6);

-- Thể thao & Du lịch
INSERT INTO
    categories (id, name, parent_id)
VALUES (32, 'Dụng cụ thể thao', 7),
    (33, 'Đồ cắm trại', 7),
    (34, 'Golf', 7);

-- Sách & Văn phòng
INSERT INTO
    categories (id, name, parent_id)
VALUES (35, 'Sách hiếm', 8),
    (36, 'Văn phòng phẩm', 8);

-- Reset sequence for categories
SELECT setval(
        'categories_id_seq', (
            SELECT MAX(id)
            FROM categories
        )
    );

-- ================================================
-- 2. USERS (admin, sellers and bidders)
-- ================================================
-- Password: password123 (bcrypt hash)

INSERT INTO
    users (
        id,
        role,
        full_name,
        email,
        password_hash,
        address,
        date_of_birth,
        rating,
        is_active
    )
VALUES
    -- Admin
    (
        1,
        'admin',
        'Admin BidHub',
        'admin@bidhub.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        'Hà Nội, Việt Nam',
        '1985-01-15',
        5.00,
        true
    ),
    -- Sellers
    (
        2,
        'seller',
        'Nguyễn Văn Bán',
        'seller1@test.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        '123 Nguyễn Huệ, Q1, HCM',
        '1990-05-20',
        4.85,
        true
    ),
    (
        3,
        'seller',
        'Trần Thị Shop',
        'seller2@test.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        '456 Lê Lợi, Q3, HCM',
        '1988-08-10',
        4.50,
        true
    ),
    (
        4,
        'seller',
        'Lê Minh Store',
        'seller3@test.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        '789 Hai Bà Trưng, Hà Nội',
        '1992-12-25',
        4.90,
        true
    ),
    -- Bidders
    (
        5,
        'bidder',
        'Phạm Văn Mua',
        'bidder1@test.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        '111 Trần Hưng Đạo, Q5, HCM',
        '1995-03-15',
        4.20,
        true
    ),
    (
        6,
        'bidder',
        'Hoàng Thị Đấu',
        'bidder2@test.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        '222 Lý Thường Kiệt, Q10, HCM',
        '1993-07-22',
        4.70,
        true
    ),
    (
        7,
        'bidder',
        'Vũ Đức Giá',
        'bidder3@test.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        '333 Nguyễn Trãi, Hà Nội',
        '1991-11-08',
        3.80,
        true
    ),
    (
        8,
        'bidder',
        'Đỗ Thị Thầu',
        'bidder4@test.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        '444 Cầu Giấy, Hà Nội',
        '1994-04-18',
        4.50,
        true
    ),
    (
        9,
        'bidder',
        'Ngô Văn Bid',
        'bidder5@test.com',
        '$2b$10$CNsCCMjsbKv67mDI6OX/p.3PbZ80j8d.tf.cRkuyMIlYTtA77o5d2',
        '555 Bình Thạnh, HCM',
        '1996-09-30',
        0.00,
        true
    );

-- Reset sequence for users
SELECT setval( 'users_id_seq', ( SELECT MAX(id) FROM users ) );