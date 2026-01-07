-- ================================================
-- SEED DATA FOR BIDHUB AUCTION PLATFORM
-- Run this script after init.sql to populate test data
-- ================================================

-- ================================================
-- CLEAN UP OLD DATA (Run this before inserting new data)
-- ================================================
TRUNCATE TABLE notifications,
product_description_history,
auto_bid_configs,
watchlists,
user_ratings,
product_questions,
bids,
product_images,
products,
users,
categories,
denied_bidders,
unrated_bidder_permissions,
upgrade_requests,
refresh_tokens,
orders,
chat_messages RESTART IDENTITY CASCADE;

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
-- 2. USERS (sellers and bidders)
-- ================================================
-- Password: password123 (bcrypt hash)
-- $2b$10$K8Y6Kj8Y5F5F5F5F5F5F5OQY5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F

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
        '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
        'Hà Nội, Việt Nam',
        '1985-01-15',
        0.00,
        true
    ),

-- Sellers
(
    2,
    'seller',
    'Nguyễn Văn Bán',
    'seller1@test.com',
    '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
    '123 Nguyễn Huệ, Q1, HCM',
    '1990-05-20',
    0.00,
    true
),
(
    3,
    'seller',
    'Trần Thị Shop',
    'seller2@test.com',
    '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
    '456 Lê Lợi, Q3, HCM',
    '1988-08-10',
    0.00,
    true
),
(
    4,
    'seller',
    'Lê Minh Store',
    'seller3@test.com',
    '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
    '789 Hai Bà Trưng, Hà Nội',
    '1992-12-25',
    0.00,
    true
),

-- Bidders
(
    5,
    'bidder',
    'Phạm Văn Mua',
    'bidder1@test.com',
    '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
    '111 Trần Hưng Đạo, Q5, HCM',
    '1995-03-15',
    0.00,
    true
),
(
    6,
    'bidder',
    'Hoàng Thị Đấu',
    'bidder2@test.com',
    '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
    '222 Lý Thường Kiệt, Q10, HCM',
    '1993-07-22',
    0.00,
    true
),
(
    7,
    'bidder',
    'Vũ Đức Giá',
    'bidder3@test.com',
    '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
    '333 Nguyễn Trãi, Hà Nội',
    '1991-11-08',
    0.00,
    true
),
(
    8,
    'bidder',
    'Đỗ Thị Thầu',
    'bidder4@test.com',
    '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
    '444 Cầu Giấy, Hà Nội',
    '1994-04-18',
    0.00,
    true
),
(
    9,
    'bidder',
    'Ngô Văn Bid',
    'bidder5@test.com',
    '$2b$10$MWK3pa.t/IaiU1k99QGSZuws9RUsoB2ffOwSNfvC.MtAJixvmj47G',
    '555 Bình Thạnh, HCM',
    '1996-09-30',
    0.00,
    true
);

-- Reset sequence for users
SELECT setval( 'users_id_seq', ( SELECT MAX(id) FROM users ) );

-- ================================================
-- 3. PRODUCTS
-- ================================================
-- Products ending soon (within 24 hours)
INSERT INTO
    products (
        id,
        seller_id,
        category_id,
        title,
        description,
        start_price,
        current_price,
        buy_now_price,
        bid_step,
        start_time,
        end_time,
        status,
        auto_extend,
        total_bids
    )
VALUES (
        1,
        2,
        9,
        'iPhone 15 Pro Max 256GB - Like New',
        'iPhone 15 Pro Max màu Titan Tự Nhiên, dung lượng 256GB. Máy còn bảo hành Apple đến tháng 6/2025. Đầy đủ phụ kiện, hộp zin. Pin 98%, không trầy xước.',
        25000000,
        32500000,
        35000000,
        500000,
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        CURRENT_TIMESTAMP + INTERVAL '2 hours',
        'active',
        true,
        15
    ),
    (
        2,
        3,
        15,
        'Đồng hồ Rolex Submariner Date - Chính hãng',
        'Rolex Submariner Date 126610LN, đường kính 41mm. Đồng hồ chính hãng, fullbox giấy tờ. Mua năm 2023, còn bảo hành quốc tế.',
        180000000,
        195000000,
        220000000,
        5000000,
        CURRENT_TIMESTAMP - INTERVAL '6 days',
        CURRENT_TIMESTAMP + INTERVAL '5 hours',
        'active',
        true,
        8
    ),
    (
        3,
        4,
        10,
        'MacBook Pro M3 Pro 14 inch - 18GB RAM',
        'MacBook Pro 14 inch chip M3 Pro, RAM 18GB, SSD 512GB. Màu Space Black. Mới 99%, sạc 15 cycle. Fullbox, bảo hành Apple.',
        45000000,
        52000000,
        58000000,
        1000000,
        CURRENT_TIMESTAMP - INTERVAL '4 days',
        CURRENT_TIMESTAMP + INTERVAL '8 hours',
        'active',
        false,
        12
    ),

-- Products with most bids
(
    4,
    2,
    17,
    'Giày Nike Air Jordan 1 Retro High - Size 42',
    'Nike Air Jordan 1 Retro High OG "Chicago" 2022. Size 42, DS (Deadstock - chưa qua sử dụng). Fullbox, giấy tờ đầy đủ. Giày sưu tầm, số lượng giới hạn.',
    8000000,
    18500000,
    25000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'active',
    true,
    28
),
(
    5,
    3,
    31,
    'Bộ LEGO Star Wars Ultimate Millennium Falcon 75192',
    'LEGO Star Wars Millennium Falcon 75192 - Bộ lớn nhất với 7541 chi tiết. Hộp nguyên seal, chưa khui. Phiên bản giới hạn, không còn sản xuất.',
    15000000,
    24000000,
    30000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    'active',
    true,
    22
),
(
    6,
    4,
    13,
    'Sony A7 IV + Lens 24-70mm f/2.8 GM II',
    'Combo máy ảnh Sony A7 IV body + lens Sony FE 24-70mm f/2.8 GM II. Máy mới 99%, shutter count 5000. Lens như mới, đầy đủ hood, filter UV. Tặng kèm thẻ 128GB.',
    65000000,
    78000000,
    85000000,
    2000000,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    false,
    18
),

-- Products with highest prices
(
    7,
    2,
    24,
    'Mercedes-Benz S450 Luxury 2023 - Biển đẹp',
    'Mercedes S450 Luxury đời 2023, màu đen. Xe lướt 8000km, 1 chủ từ đầu. Biển số đẹp tứ quý. Full option: Cửa hít, cốp điện, ghế massage, Burmester 3D.',
    3500000000,
    3850000000,
    4200000000,
    50000000,
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'active',
    true,
    7
),
(
    8,
    3,
    5,
    'Căn hộ Vinhomes Central Park - 3PN - View sông',
    'Căn hộ cao cấp tại Vinhomes Central Park, Bình Thạnh. Diện tích 116m2, 3 phòng ngủ, 2 WC. Tầng cao view sông Sài Gòn. Full nội thất cao cấp.',
    6000000000,
    6500000000,
    7000000000,
    100000000,
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    'active',
    false,
    5
),
(
    9,
    4,
    28,
    'Tranh sơn dầu "Phố cổ Hà Nội" - Họa sĩ Bùi Xuân Phái',
    'Tranh sơn dầu nguyên bản của họa sĩ Bùi Xuân Phái, chủ đề Phố cổ Hà Nội. Kích thước 80x100cm. Có chứng nhận của gia đình họa sĩ và giám định.',
    500000000,
    720000000,
    900000000,
    20000000,
    CURRENT_TIMESTAMP - INTERVAL '8 days',
    CURRENT_TIMESTAMP + INTERVAL '6 days',
    'active',
    false,
    11
),

-- More products for variety
(
    10,
    2,
    11,
    'iPad Pro M2 12.9 inch 256GB + Apple Pencil 2',
    'iPad Pro M2 12.9 inch, WiFi + Cellular, 256GB màu Space Gray. Kèm Apple Pencil 2 và Magic Keyboard. Pin 95%, không trầy.',
    28000000,
    31000000,
    35000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    'active',
    true,
    9
),
(
    11,
    3,
    16,
    'Túi Louis Vuitton Neverfull MM Monogram',
    'Túi LV Neverfull MM size trung, họa tiết Monogram cổ điển. Hàng chính hãng, mua tại store Paris. Fullbox, hóa đơn, dustbag. Mới 95%.',
    35000000,
    42000000,
    50000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    false,
    14
),
(
    12,
    4,
    34,
    'Bộ gậy golf Titleist T200 Iron Set',
    'Bộ gậy golf Titleist T200 Iron Set (5-PW). Shaft KBS Tour 120 Stiff. Grip Golf Pride mới. Đã sử dụng 10 rounds, như mới.',
    45000000,
    48000000,
    55000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'active',
    false,
    6
),
(
    13,
    2,
    14,
    'Samsung OLED TV 65 inch S95C 2024',
    'TV Samsung OLED 65 inch dòng S95C mới nhất 2024. Tấm nền QD-OLED, độ sáng 2000 nits. Fullbox, mới 100%. Bảo hành Samsung 24 tháng.',
    55000000,
    58000000,
    65000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '6 days',
    'active',
    true,
    4
),
(
    14,
    3,
    25,
    'Honda SH 350i 2024 - ABS - Smartkey',
    'Honda SH 350i phiên bản 2024, màu đen nhám. Xe mới 100%, chưa đăng ký. Có ABS, Smartkey, HSTC. Bảo hành Honda 3 năm.',
    155000000,
    162000000,
    175000000,
    2000000,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    'active',
    true,
    10
),
(
    15,
    4,
    29,
    'Bộ sưu tập tiền Polymer Việt Nam 2003-2023',
    'Bộ sưu tập đầy đủ tiền Polymer Việt Nam từ 2003-2023. Gồm 6 mệnh giá, các năm phát hành, serial đẹp. Tình trạng UNC (chưa qua sử dụng).',
    12000000,
    15500000,
    20000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'active',
    false,
    13
),

-- ĐIỆN THOẠI (category 9) - 8 products
(
    16,
    2,
    9,
    'Samsung Galaxy S24 Ultra 512GB - Titanium Gray',
    'Samsung S24 Ultra màu Titanium Gray, bộ nhớ 512GB. Máy mới 99%, fullbox nguyên seal. Màn hình 6.8 inch Dynamic AMOLED, S-Pen tích hợp. Bảo hành chính hãng 12 tháng.',
    28000000,
    30000000,
    33000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'active',
    true,
    8
),
(
    17,
    3,
    9,
    'iPhone 14 Pro 256GB - Deep Purple',
    'iPhone 14 Pro màu Deep Purple, dung lượng 256GB. Máy like new 98%, pin 100%. Dynamic Island, camera 48MP. Fullbox, bảo hành Apple Care+ còn 8 tháng.',
    22000000,
    24500000,
    27000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    'active',
    false,
    11
),
(
    18,
    4,
    9,
    'Xiaomi 14 Ultra 16GB/512GB - Black',
    'Xiaomi 14 Ultra phiên bản cao cấp 16GB RAM, 512GB ROM. Camera Leica 50MP. Máy mới nguyên seal chưa kích hoạt. Màu đen, fullbox, bảo hành Xiaomi 18 tháng.',
    20000000,
    21500000,
    24000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '6 days',
    'active',
    true,
    5
),
(
    19,
    2,
    9,
    'Google Pixel 8 Pro 256GB - Porcelain',
    'Google Pixel 8 Pro màu Porcelain, 256GB. Máy mới 100%, chưa active. Camera AI xịn sò, Tensor G3. Fullbox, bảo hành Google 24 tháng. Hỗ trợ cập nhật 7 năm.',
    18000000,
    19500000,
    22000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    'active',
    false,
    7
),
(
    20,
    3,
    9,
    'OPPO Find X7 Ultra 16GB/512GB - Ocean Blue',
    'OPPO Find X7 Ultra màu Ocean Blue. 16GB RAM, 512GB ROM. Camera Hasselblad 50MP x4. Màn hình AMOLED 120Hz. Mới 99%, fullbox, bảo hành 12 tháng.',
    19000000,
    20500000,
    23000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    true,
    9
),
(
    21,
    4,
    9,
    'iPhone 13 Pro Max 512GB - Sierra Blue',
    'iPhone 13 Pro Max màu Sierra Blue, 512GB. Máy zin all, pin 95%. ProMotion 120Hz, camera macro. Fullbox, phụ kiện đầy đủ. Bảo hành còn 3 tháng.',
    20000000,
    22000000,
    25000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '8 days',
    'active',
    false,
    10
),
(
    22,
    2,
    9,
    'Samsung Galaxy Z Fold 5 512GB - Phantom Black',
    'Samsung Z Fold 5 màu Phantom Black, 512GB. Điện thoại gập cao cấp, màn hình 7.6 inch. Mới 98%, không nếp gấp. Fullbox, S-Pen Fold Edition. Bảo hành 10 tháng.',
    35000000,
    38000000,
    42000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'active',
    true,
    12
),
(
    23,
    3,
    9,
    'Vivo X100 Pro 16GB/512GB - Asteroid Black',
    'Vivo X100 Pro màu Asteroid Black. 16GB RAM, 512GB ROM. Camera Zeiss Vario-Tessar 50MP. Chip Dimensity 9300. Mới 100%, nguyên seal. Bảo hành Vivo 18 tháng.',
    22000000,
    23500000,
    26000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '9 days',
    'active',
    false,
    6
),

-- LAPTOP (category 10) - 8 products
(
    24,
    4,
    10,
    'Dell XPS 15 9530 - Intel Core i7 13700H',
    'Dell XPS 15 9530, CPU i7-13700H, RAM 32GB DDR5, SSD 1TB. Màn hình 15.6 inch 3.5K OLED. RTX 4050 6GB. Mới 99%, bảo hành Dell 20 tháng. Fullbox.',
    42000000,
    45000000,
    50000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'active',
    true,
    9
),
(
    25,
    2,
    10,
    'MacBook Air M2 15 inch 16GB/512GB - Midnight',
    'MacBook Air M2 15 inch màu Midnight. RAM 16GB, SSD 512GB. Màn hình Liquid Retina 15.3 inch. Mới 100%, chưa active. Fullbox, bảo hành Apple 12 tháng.',
    32000000,
    34500000,
    38000000,
    500000,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '6 days',
    'active',
    false,
    8
),
(
    26,
    3,
    10,
    'ASUS ROG Zephyrus G16 - RTX 4070',
    'ASUS ROG Zephyrus G16 2024. Intel Core Ultra 9, RAM 32GB, SSD 1TB. RTX 4070 8GB. Màn hình 16 inch 2.5K 240Hz. Gaming laptop cao cấp. Mới 98%, bảo hành 22 tháng.',
    55000000,
    58000000,
    65000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    'active',
    true,
    11
),
(
    27,
    4,
    10,
    'Lenovo ThinkPad X1 Carbon Gen 11',
    'Lenovo ThinkPad X1 Carbon Gen 11. i7-1365U, RAM 32GB, SSD 1TB. Màn hình 14 inch 2.8K OLED. Siêu mỏng nhẹ 1.12kg. Doanh nhân cao cấp. Mới 99%, bảo hành 18 tháng.',
    38000000,
    41000000,
    46000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    false,
    7
),
(
    28,
    2,
    10,
    'HP Spectre x360 16 - 2-in-1 OLED',
    'HP Spectre x360 16 inch 2-in-1. i7-13700H, RAM 16GB, SSD 1TB. Màn hình 16 inch 3K OLED cảm ứng xoay 360°. Intel Arc A370M. Mới 97%, bảo hành HP 15 tháng.',
    40000000,
    43000000,
    48000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    'active',
    true,
    10
),
(
    29,
    3,
    10,
    'Acer Predator Helios 16 - RTX 4060',
    'Acer Predator Helios 16. i7-13700HX, RAM 16GB DDR5, SSD 512GB. RTX 4060 8GB. Màn hình 16 inch WQXGA 165Hz. Gaming laptop tầm trung. Mới 98%, bảo hành 20 tháng.',
    35000000,
    37500000,
    42000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '8 days',
    'active',
    false,
    6
),
(
    30,
    4,
    10,
    'Microsoft Surface Laptop Studio 2',
    'Surface Laptop Studio 2. i7-13700H, RAM 32GB, SSD 1TB. RTX 4050 6GB. Màn hình 14.4 inch PixelSense cảm ứng. Thiết kế độc đáo 3 chế độ. Mới 99%, bảo hành 16 tháng.',
    48000000,
    51000000,
    56000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'active',
    true,
    8
),
(
    31,
    2,
    10,
    'LG Gram 17 2024 - Siêu nhẹ 1.35kg',
    'LG Gram 17 inch 2024. Intel Core Ultra 7, RAM 32GB, SSD 1TB. Màn hình 17 inch WQXGA IPS. Siêu nhẹ chỉ 1.35kg. Pin 90Wh cực khủng. Mới 100%, bảo hành LG 24 tháng.',
    38000000,
    40500000,
    45000000,
    1000000,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '9 days',
    'active',
    false,
    5
),

-- Ô TÔ (category 24) - 9 products
(
    32,
    3,
    24,
    'Toyota Camry 2.5Q 2023 - Trắng Ngọc Trai',
    'Toyota Camry 2.5Q 2023 màu trắng ngọc trai. Xe lướt 12.000km, 1 chủ từ đầu. Full option: cửa hít, ghế da, cửa sổ trời, camera 360. Bảo hành Toyota 28 tháng.',
    1150000000,
    1200000000,
    1300000000,
    20000000,
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    'active',
    true,
    8
),
(
    33,
    4,
    24,
    'Honda CR-V L 2024 - 7 chỗ - Đen',
    'Honda CR-V L 2024, màu đen, 7 chỗ. Xe mới chưa đăng ký, 0km. Full option cao cấp nhất: Honda Sensing, cửa sổ trời toàn cảnh, nội thất da. Bảo hành Honda 3 năm.',
    1250000000,
    1280000000,
    1350000000,
    20000000,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '6 days',
    'active',
    false,
    6
),
(
    34,
    2,
    24,
    'Mazda CX-5 Signature Premium 2023',
    'Mazda CX-5 Signature Premium 2023 màu đỏ Soul Red. Xe đi 15.000km. Full option: ghế Nappa, Bose, HUD, cửa sổ trời. Biển số đẹp. Bảo hành Mazda 24 tháng.',
    980000000,
    1020000000,
    1100000000,
    20000000,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'active',
    true,
    9
),
(
    35,
    3,
    24,
    'BMW 530i M Sport 2022 - Xanh Phytonic Blue',
    'BMW 530i M Sport 2022 màu Phytonic Blue. Xe lướt 18.000km, 1 đời chủ. Full option M Sport: ghế thể thao, la-zăng 19 inch, HUD, Harman Kardon. Bảo hành BMW 18 tháng.',
    2100000000,
    2200000000,
    2400000000,
    50000000,
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    false,
    7
),
(
    36,
    4,
    24,
    'Audi Q7 45 TFSI 2023 - 7 chỗ - Trắng',
    'Audi Q7 45 TFSI 2023, màu trắng, 7 chỗ. Xe lướt 8.000km. Full option: Matrix LED, Virtual Cockpit Plus, Bang & Olufsen 3D, ghế massage. Bảo hành Audi 30 tháng.',
    3200000000,
    3350000000,
    3600000000,
    50000000,
    CURRENT_TIMESTAMP - INTERVAL '8 days',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'active',
    true,
    5
),
(
    37,
    2,
    24,
    'Vinfast VF8 Plus 2023 - Xanh Đại Dương',
    'VinFast VF8 Plus 2023 màu Xanh Đại Dương. Xe điện, pin thuê. Đi 10.000km. Full option: ADAS Level 2, ghế da Nappa, cửa sổ trời. Bảo hành VinFast 32 tháng.',
    850000000,
    900000000,
    980000000,
    20000000,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    'active',
    false,
    11
),
(
    38,
    3,
    24,
    'Hyundai Tucson 1.6T Turbo 2023 - Đỏ',
    'Hyundai Tucson 1.6T Turbo 2023 màu đỏ. Xe lướt 14.000km. Full option: Smartsense, cửa sổ trời toàn cảnh, ghế da, 2 màn hình 10.25 inch. Bảo hành Hyundai 26 tháng.',
    950000000,
    990000000,
    1080000000,
    20000000,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '6 days',
    'active',
    true,
    8
),
(
    39,
    4,
    24,
    'Kia Sorento Signature 2024 - 7 chỗ - Xám',
    'Kia Sorento Signature 2024 màu xám, 7 chỗ. Xe mới 100%, chưa đăng ký. Full option cao cấp: ghế da Nappa, Bose, HUD, cửa sổ trời. Bảo hành Kia 3 năm.',
    1180000000,
    1220000000,
    1300000000,
    20000000,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '8 days',
    'active',
    false,
    7
),
(
    40,
    2,
    24,
    'Ford Ranger Raptor 2023 - Đỏ Performance',
    'Ford Ranger Raptor 2023 màu đỏ Performance. Bán tải hiệu suất cao, động cơ twin-turbo 3.0L. Xe đi 9.000km. Full option: FOX Racing, ghế Recaro. Bảo hành Ford 27 tháng.',
    1450000000,
    1520000000,
    1650000000,
    30000000,
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    'active',
    true,
    10
);

-- Reset sequence for products
SELECT setval( 'products_id_seq', ( SELECT MAX(id) FROM products ) );

-- ================================================
-- 4. PRODUCT IMAGES
-- ================================================
INSERT INTO
    product_images (product_id, url, is_main)
VALUES
    -- iPhone 15 Pro Max
    (
        1,
        'https://picsum.photos/seed/iphone1/800/600',
        true
    ),
    (
        1,
        'https://picsum.photos/seed/iphone2/800/600',
        false
    ),
    (
        1,
        'https://picsum.photos/seed/iphone3/800/600',
        false
    ),

-- Rolex
(
    2,
    'https://picsum.photos/seed/rolex1/800/600',
    true
),
(
    2,
    'https://picsum.photos/seed/rolex2/800/600',
    false
),

-- MacBook
(
    3,
    'https://picsum.photos/seed/macbook1/800/600',
    true
),
(
    3,
    'https://picsum.photos/seed/macbook2/800/600',
    false
),
(
    3,
    'https://picsum.photos/seed/macbook3/800/600',
    false
),

-- Nike Air Jordan
(
    4,
    'https://picsum.photos/seed/jordan1/800/600',
    true
),
(
    4,
    'https://picsum.photos/seed/jordan2/800/600',
    false
),
(
    4,
    'https://picsum.photos/seed/jordan3/800/600',
    false
),
(
    4,
    'https://picsum.photos/seed/jordan4/800/600',
    false
),

-- LEGO Star Wars
(
    5,
    'https://picsum.photos/seed/lego1/800/600',
    true
),
(
    5,
    'https://picsum.photos/seed/lego2/800/600',
    false
),

-- Sony Camera
(
    6,
    'https://picsum.photos/seed/sony1/800/600',
    true
),
(
    6,
    'https://picsum.photos/seed/sony2/800/600',
    false
),
(
    6,
    'https://picsum.photos/seed/sony3/800/600',
    false
),

-- Mercedes
(
    7,
    'https://picsum.photos/seed/mercedes1/800/600',
    true
),
(
    7,
    'https://picsum.photos/seed/mercedes2/800/600',
    false
),
(
    7,
    'https://picsum.photos/seed/mercedes3/800/600',
    false
),
(
    7,
    'https://picsum.photos/seed/mercedes4/800/600',
    false
),
(
    7,
    'https://picsum.photos/seed/mercedes5/800/600',
    false
),

-- Apartment
(
    8,
    'https://picsum.photos/seed/apartment1/800/600',
    true
),
(
    8,
    'https://picsum.photos/seed/apartment2/800/600',
    false
),
(
    8,
    'https://picsum.photos/seed/apartment3/800/600',
    false
),

-- Painting
(
    9,
    'https://picsum.photos/seed/painting1/800/600',
    true
),
(
    9,
    'https://picsum.photos/seed/painting2/800/600',
    false
),

-- iPad
(
    10,
    'https://picsum.photos/seed/ipad1/800/600',
    true
),
(
    10,
    'https://picsum.photos/seed/ipad2/800/600',
    false
),

-- LV Bag
(
    11,
    'https://picsum.photos/seed/lv1/800/600',
    true
),
(
    11,
    'https://picsum.photos/seed/lv2/800/600',
    false
),
(
    11,
    'https://picsum.photos/seed/lv3/800/600',
    false
),

-- Golf
(
    12,
    'https://picsum.photos/seed/golf1/800/600',
    true
),
(
    12,
    'https://picsum.photos/seed/golf2/800/600',
    false
),

-- Samsung TV
(
    13,
    'https://picsum.photos/seed/tv1/800/600',
    true
),
(
    13,
    'https://picsum.photos/seed/tv2/800/600',
    false
),

-- Honda SH
(
    14,
    'https://picsum.photos/seed/sh1/800/600',
    true
),
(
    14,
    'https://picsum.photos/seed/sh2/800/600',
    false
),
(
    14,
    'https://picsum.photos/seed/sh3/800/600',
    false
),

-- Polymer money
(
    15,
    'https://picsum.photos/seed/money1/800/600',
    true
),
(
    15,
    'https://picsum.photos/seed/money2/800/600',
    false
),

-- Samsung Galaxy S24 Ultra
(
    16,
    'https://picsum.photos/seed/s24ultra1/800/600',
    true
),
(
    16,
    'https://picsum.photos/seed/s24ultra2/800/600',
    false
),
(
    16,
    'https://picsum.photos/seed/s24ultra3/800/600',
    false
),

-- iPhone 14 Pro
(
    17,
    'https://picsum.photos/seed/iphone14pro1/800/600',
    true
),
(
    17,
    'https://picsum.photos/seed/iphone14pro2/800/600',
    false
),

-- Xiaomi 14 Ultra
(
    18,
    'https://picsum.photos/seed/xiaomi14ultra1/800/600',
    true
),
(
    18,
    'https://picsum.photos/seed/xiaomi14ultra2/800/600',
    false
),
(
    18,
    'https://picsum.photos/seed/xiaomi14ultra3/800/600',
    false
),

-- Google Pixel 8 Pro
(
    19,
    'https://picsum.photos/seed/pixel8pro1/800/600',
    true
),
(
    19,
    'https://picsum.photos/seed/pixel8pro2/800/600',
    false
),

-- OPPO Find X7 Ultra
(
    20,
    'https://picsum.photos/seed/oppofindx71/800/600',
    true
),
(
    20,
    'https://picsum.photos/seed/oppofindx72/800/600',
    false
),
(
    20,
    'https://picsum.photos/seed/oppofindx73/800/600',
    false
),

-- iPhone 13 Pro Max
(
    21,
    'https://picsum.photos/seed/iphone13promax1/800/600',
    true
),
(
    21,
    'https://picsum.photos/seed/iphone13promax2/800/600',
    false
),

-- Samsung Galaxy Z Fold 5
(
    22,
    'https://picsum.photos/seed/zfold51/800/600',
    true
),
(
    22,
    'https://picsum.photos/seed/zfold52/800/600',
    false
),
(
    22,
    'https://picsum.photos/seed/zfold53/800/600',
    false
),

-- Vivo X100 Pro
(
    23,
    'https://picsum.photos/seed/vivox100pro1/800/600',
    true
),
(
    23,
    'https://picsum.photos/seed/vivox100pro2/800/600',
    false
),

-- Dell XPS 15
(
    24,
    'https://picsum.photos/seed/dellxps151/800/600',
    true
),
(
    24,
    'https://picsum.photos/seed/dellxps152/800/600',
    false
),
(
    24,
    'https://picsum.photos/seed/dellxps153/800/600',
    false
),

-- MacBook Air M2 15
(
    25,
    'https://picsum.photos/seed/macbookairm151/800/600',
    true
),
(
    25,
    'https://picsum.photos/seed/macbookairm152/800/600',
    false
),

-- ASUS ROG Zephyrus G16
(
    26,
    'https://picsum.photos/seed/rogg161/800/600',
    true
),
(
    26,
    'https://picsum.photos/seed/rogg162/800/600',
    false
),
(
    26,
    'https://picsum.photos/seed/rogg163/800/600',
    false
),

-- Lenovo ThinkPad X1 Carbon
(
    27,
    'https://picsum.photos/seed/thinkpadx11/800/600',
    true
),
(
    27,
    'https://picsum.photos/seed/thinkpadx12/800/600',
    false
),

-- HP Spectre x360
(
    28,
    'https://picsum.photos/seed/spectx3601/800/600',
    true
),
(
    28,
    'https://picsum.photos/seed/spectx3602/800/600',
    false
),
(
    28,
    'https://picsum.photos/seed/spectx3603/800/600',
    false
),

-- Acer Predator Helios
(
    29,
    'https://picsum.photos/seed/predatorhelios1/800/600',
    true
),
(
    29,
    'https://picsum.photos/seed/predatorhelios2/800/600',
    false
),

-- Surface Laptop Studio 2
(
    30,
    'https://picsum.photos/seed/surfacestudio1/800/600',
    true
),
(
    30,
    'https://picsum.photos/seed/surfacestudio2/800/600',
    false
),
(
    30,
    'https://picsum.photos/seed/surfacestudio3/800/600',
    false
),

-- LG Gram 17
(
    31,
    'https://picsum.photos/seed/lggram171/800/600',
    true
),
(
    31,
    'https://picsum.photos/seed/lggram172/800/600',
    false
),

-- Toyota Camry
(
    32,
    'https://picsum.photos/seed/camry1/800/600',
    true
),
(
    32,
    'https://picsum.photos/seed/camry2/800/600',
    false
),
(
    32,
    'https://picsum.photos/seed/camry3/800/600',
    false
),
(
    32,
    'https://picsum.photos/seed/camry4/800/600',
    false
),

-- Honda CR-V
(
    33,
    'https://picsum.photos/seed/crv1/800/600',
    true
),
(
    33,
    'https://picsum.photos/seed/crv2/800/600',
    false
),
(
    33,
    'https://picsum.photos/seed/crv3/800/600',
    false
),

-- Mazda CX-5
(
    34,
    'https://picsum.photos/seed/cx51/800/600',
    true
),
(
    34,
    'https://picsum.photos/seed/cx52/800/600',
    false
),
(
    34,
    'https://picsum.photos/seed/cx53/800/600',
    false
),
(
    34,
    'https://picsum.photos/seed/cx54/800/600',
    false
),

-- BMW 530i
(
    35,
    'https://picsum.photos/seed/bmw530i1/800/600',
    true
),
(
    35,
    'https://picsum.photos/seed/bmw530i2/800/600',
    false
),
(
    35,
    'https://picsum.photos/seed/bmw530i3/800/600',
    false
),
(
    35,
    'https://picsum.photos/seed/bmw530i4/800/600',
    false
),

-- Audi Q7
(
    36,
    'https://picsum.photos/seed/audiq71/800/600',
    true
),
(
    36,
    'https://picsum.photos/seed/audiq72/800/600',
    false
),
(
    36,
    'https://picsum.photos/seed/audiq73/800/600',
    false
),
(
    36,
    'https://picsum.photos/seed/audiq74/800/600',
    false
),

-- VinFast VF8
(
    37,
    'https://picsum.photos/seed/vf81/800/600',
    true
),
(
    37,
    'https://picsum.photos/seed/vf82/800/600',
    false
),
(
    37,
    'https://picsum.photos/seed/vf83/800/600',
    false
),

-- Hyundai Tucson
(
    38,
    'https://picsum.photos/seed/tucson1/800/600',
    true
),
(
    38,
    'https://picsum.photos/seed/tucson2/800/600',
    false
),
(
    38,
    'https://picsum.photos/seed/tucson3/800/600',
    false
),
(
    38,
    'https://picsum.photos/seed/tucson4/800/600',
    false
),

-- Kia Sorento
(
    39,
    'https://picsum.photos/seed/sorento1/800/600',
    true
),
(
    39,
    'https://picsum.photos/seed/sorento2/800/600',
    false
),
(
    39,
    'https://picsum.photos/seed/sorento3/800/600',
    false
),

-- Ford Ranger Raptor
(
    40,
    'https://picsum.photos/seed/raptor1/800/600',
    true
),
(
    40,
    'https://picsum.photos/seed/raptor2/800/600',
    false
),
(
    40,
    'https://picsum.photos/seed/raptor3/800/600',
    false
),
(
    40,
    'https://picsum.photos/seed/raptor4/800/600',
    false
);

-- ================================================
-- 5. BIDS (Disable trigger temporarily to set correct data)
-- ================================================
-- Disable trigger to manually control total_bids
ALTER TABLE bids DISABLE TRIGGER trigger_increment_bids;

-- Bids for iPhone 15 Pro Max (product 1)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        1,
        5,
        26000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '1 hour'
    ),
    (
        1,
        6,
        26500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '2 hours'
    ),
    (
        1,
        7,
        27000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        1,
        5,
        28000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '1 hour'
    ),
    (
        1,
        8,
        29000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        1,
        6,
        29500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '5 hours'
    ),
    (
        1,
        5,
        30000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        1,
        7,
        30500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '3 hours'
    ),
    (
        1,
        8,
        31000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        1,
        5,
        31500000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '2 hours'
    ),
    (
        1,
        6,
        32000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '12 hours'
    ),
    (
        1,
        8,
        32500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '6 hours'
    );

-- Bids for Rolex (product 2)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        2,
        6,
        182000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        2,
        8,
        185000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        2,
        5,
        188000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        2,
        6,
        190000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        2,
        8,
        192000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        2,
        5,
        195000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '8 hours'
    );

-- Bids for Nike Air Jordan (product 4) - Most bids
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        4,
        5,
        8500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        4,
        6,
        9000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 hour'
    ),
    (
        4,
        7,
        9500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '2 hours'
    ),
    (
        4,
        8,
        10000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '3 hours'
    ),
    (
        4,
        9,
        10500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        4,
        5,
        11000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '1 hour'
    ),
    (
        4,
        6,
        11500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '2 hours'
    ),
    (
        4,
        7,
        12000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '3 hours'
    ),
    (
        4,
        8,
        12500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '4 hours'
    ),
    (
        4,
        9,
        13000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '5 hours'
    ),
    (
        4,
        5,
        13500000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        4,
        6,
        14000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '1 hour'
    ),
    (
        4,
        7,
        14500000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '2 hours'
    ),
    (
        4,
        8,
        15000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '3 hours'
    ),
    (
        4,
        5,
        15500000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '4 hours'
    ),
    (
        4,
        6,
        16000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '20 hours'
    ),
    (
        4,
        7,
        16500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '15 hours'
    ),
    (
        4,
        8,
        17000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '10 hours'
    ),
    (
        4,
        5,
        17500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '8 hours'
    ),
    (
        4,
        6,
        18000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 hours'
    ),
    (
        4,
        7,
        18500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 hours'
    );

-- Bids for LEGO (product 5)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        5,
        7,
        15500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        5,
        8,
        16000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        5,
        5,
        17000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '5 hours'
    ),
    (
        5,
        6,
        18000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        5,
        7,
        19000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '3 hours'
    ),
    (
        5,
        8,
        20000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        5,
        5,
        21000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '6 hours'
    ),
    (
        5,
        6,
        22000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        5,
        7,
        23000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '18 hours'
    ),
    (
        5,
        8,
        24000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '6 hours'
    );

-- Re-enable trigger
ALTER TABLE bids ENABLE TRIGGER trigger_increment_bids;

-- ================================================
-- 6. PRODUCT QUESTIONS AND ANSWERS
-- ================================================
INSERT INTO
    product_questions (
        product_id,
        user_id,
        question,
        answer,
        created_at,
        answered_at
    )
VALUES
    -- iPhone questions
    (
        1,
        5,
        'Máy có bị rơi vỡ hay ngấm nước chưa ạ?',
        'Chưa bạn nhé, máy còn rất mới, không va đập hay ngấm nước.',
        CURRENT_TIMESTAMP - INTERVAL '4 days',
        CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '2 hours'
    ),
    (
        1,
        6,
        'Pin có bị chai không ạ? Xài có nóng máy không?',
        'Pin 98% như mô tả bạn nhé, xài bình thường không nóng.',
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 hour'
    ),
    (
        1,
        7,
        'Có hỗ trợ ship COD không shop?',
        'Có hỗ trợ COD toàn quốc bạn nhé.',
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '3 hours'
    ),

-- Rolex questions
(
    2,
    8,
    'Đồng hồ có bị sửa chữa hay thay linh kiện gì chưa?',
    'Đồng hồ nguyên bản 100%, chưa sửa chữa hay thay thế gì bạn nhé.',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '1 hour'
),
(
    2,
    5,
    'Có thể xem trực tiếp tại shop không ạ?',
    'Có bạn nhé, shop ở Q1 HCM, liên hệ trước để hẹn lịch.',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '2 hours'
),

-- MacBook questions
(
    3,
    6,
    'Máy có thể upgrade RAM không ạ?',
    'Không bạn ơi, MacBook M3 RAM hàn liền không upgrade được.',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 hour'
),

-- Nike questions (unanswered)
(
    4,
    9,
    'Có size 43 không shop?',
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    NULL
),
(
    4,
    8,
    'Giày có bill mua không ạ?',
    'Có đầy đủ bill mua từ store bạn nhé, kèm theo trong hộp.',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '4 hours'
),

-- Mercedes questions
(
    7,
    5,
    'Xe có bị tai nạn hay sơn lại chưa ạ?',
    'Xe nguyên zin, check hãng full lịch sử bạn nhé.',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '3 hours'
);

-- ================================================
-- 7. USER RATINGS (Mixed positive and negative for varied scores)
-- ================================================
INSERT INTO
    user_ratings (
        rater_id,
        rated_user_id,
        product_id,
        score,
        comment,
        created_at
    )
VALUES
    -- Ratings for seller 2 (3 positive, 1 negative = 0.75)
    (
        5,
        2,
        NULL,
        1,
        'Giao hàng nhanh, đóng gói cẩn thận. Rất hài lòng!',
        CURRENT_TIMESTAMP - INTERVAL '30 days'
    ),
    (
        6,
        2,
        NULL,
        1,
        'Shop uy tín, sản phẩm đúng mô tả.',
        CURRENT_TIMESTAMP - INTERVAL '25 days'
    ),
    (
        7,
        2,
        NULL,
        1,
        'Sản phẩm tốt, giao hơi chậm.',
        CURRENT_TIMESTAMP - INTERVAL '20 days'
    ),
    (
        8,
        2,
        NULL,
        -1,
        'Đóng gói không cẩn thận, hàng bị móp.',
        CURRENT_TIMESTAMP - INTERVAL '15 days'
    ),

-- Ratings for seller 3 (5 positive, 2 negative = 0.71)
(
    5,
    3,
    NULL,
    1,
    'Hàng ok, đóng gói tốt.',
    CURRENT_TIMESTAMP - INTERVAL '28 days'
),
(
    6,
    3,
    NULL,
    1,
    'Rất hài lòng với sản phẩm.',
    CURRENT_TIMESTAMP - INTERVAL '22 days'
),
(
    8,
    3,
    NULL,
    1,
    'Shop nhiệt tình, hàng đẹp.',
    CURRENT_TIMESTAMP - INTERVAL '18 days'
),
(
    7,
    3,
    NULL,
    -1,
    'Giao hàng chậm quá.',
    CURRENT_TIMESTAMP - INTERVAL '15 days'
),
(
    9,
    3,
    NULL,
    1,
    'Sản phẩm tốt.',
    CURRENT_TIMESTAMP - INTERVAL '12 days'
),
(
    5,
    3,
    NULL,
    1,
    'Uy tín, sẽ mua lại.',
    CURRENT_TIMESTAMP - INTERVAL '8 days'
),
(
    6,
    3,
    NULL,
    -1,
    'Hàng không đúng mô tả.',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),

-- Ratings for seller 4 (6 positive, 1 negative = 0.86)
(
    5,
    4,
    NULL,
    1,
    'Sản phẩm chất lượng cao, giá tốt.',
    CURRENT_TIMESTAMP - INTERVAL '26 days'
),
(
    6,
    4,
    NULL,
    1,
    'Shop rất uy tín, recommend!',
    CURRENT_TIMESTAMP - INTERVAL '21 days'
),
(
    7,
    4,
    NULL,
    1,
    'Hàng xịn, giao nhanh.',
    CURRENT_TIMESTAMP - INTERVAL '16 days'
),
(
    8,
    4,
    NULL,
    1,
    'Tuyệt đối hài lòng!',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
),
(
    9,
    4,
    NULL,
    1,
    'Chất lượng tốt.',
    CURRENT_TIMESTAMP - INTERVAL '7 days'
),
(
    5,
    4,
    NULL,
    1,
    'Sẽ ủng hộ tiếp.',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    6,
    4,
    NULL,
    -1,
    'Lần này hàng không được tốt lắm.',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),

-- Ratings for bidders
-- Bidder 5 (3 positive, 1 negative = 0.75)
(
    2,
    5,
    NULL,
    1,
    'Thanh toán nhanh, giao dịch suôn sẻ.',
    CURRENT_TIMESTAMP - INTERVAL '24 days'
),
(
    3,
    5,
    NULL,
    1,
    'Khách hàng dễ thương, giao dịch tốt.',
    CURRENT_TIMESTAMP - INTERVAL '19 days'
),
(
    4,
    5,
    NULL,
    1,
    'Thanh toán đúng hẹn.',
    CURRENT_TIMESTAMP - INTERVAL '13 days'
),
(
    2,
    5,
    NULL,
    -1,
    'Hẹn nhiều lần mới thanh toán.',
    CURRENT_TIMESTAMP - INTERVAL '8 days'
),

-- Bidder 6 (4 positive, 1 negative = 0.80)
(
    2,
    6,
    NULL,
    1,
    'Khách hàng tuyệt vời!',
    CURRENT_TIMESTAMP - INTERVAL '23 days'
),
(
    3,
    6,
    NULL,
    1,
    'Thanh toán ngay, rất hài lòng.',
    CURRENT_TIMESTAMP - INTERVAL '17 days'
),
(
    4,
    6,
    NULL,
    1,
    'Giao dịch tốt.',
    CURRENT_TIMESTAMP - INTERVAL '12 days'
),
(
    2,
    6,
    NULL,
    1,
    'Khách uy tín.',
    CURRENT_TIMESTAMP - INTERVAL '7 days'
),
(
    3,
    6,
    NULL,
    -1,
    'Không nhận hàng đúng hẹn.',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),

-- Bidder 7 (1 positive, 1 negative = 0.50)
(
    2,
    7,
    NULL,
    -1,
    'Thanh toán hơi chậm.',
    CURRENT_TIMESTAMP - INTERVAL '22 days'
),
(
    3,
    7,
    NULL,
    1,
    'Ok, giao dịch bình thường.',
    CURRENT_TIMESTAMP - INTERVAL '14 days'
),

-- Bidder 8 (2 positive, 1 negative = 0.67)
(
    2,
    8,
    NULL,
    1,
    'Khách hàng thân thiện!',
    CURRENT_TIMESTAMP - INTERVAL '20 days'
),
(
    4,
    8,
    NULL,
    1,
    'Giao dịch tốt, recommend.',
    CURRENT_TIMESTAMP - INTERVAL '11 days'
),
(
    3,
    8,
    NULL,
    -1,
    'Có hẹn nhưng đến muộn.',
    CURRENT_TIMESTAMP - INTERVAL '6 days'
);

-- ================================================
-- 8. ORDERS (Sample completed orders)
-- ================================================
INSERT INTO
    orders (
        id,
        product_id,
        buyer_id,
        seller_id,
        order_status,
        payment_method,
        payment_status,
        payment_transaction_id,
        shipping_address,
        shipping_status,
        tracking_number,
        total_price,
        buyer_rating,
        seller_rating,
        buyer_comment,
        seller_comment,
        buyer_rated_at,
        seller_rated_at,
        completed_at,
        created_at,
        updated_at
    )
VALUES
    -- Order 1: Completed with ratings
    (
        1,
        1,
        5,
        2,
        'completed',
        'COD',
        'completed',
        'TXN001',
        '111 Trần Hưng Đạo, Q5, HCM',
        'delivered',
        'VN12345678',
        32500000,
        1,
        1,
        'Sản phẩm tốt, giao hàng nhanh.',
        'Khách hàng thanh toán đúng hẹn.',
        CURRENT_TIMESTAMP - INTERVAL '25 days',
        CURRENT_TIMESTAMP - INTERVAL '25 days',
        CURRENT_TIMESTAMP - INTERVAL '24 days',
        CURRENT_TIMESTAMP - INTERVAL '30 days',
        CURRENT_TIMESTAMP - INTERVAL '24 days'
    ),
    -- Order 2: Completed with ratings
    (
        2,
        2,
        6,
        3,
        'completed',
        'Bank Transfer',
        'completed',
        'TXN002',
        '222 Lý Thường Kiệt, Q10, HCM',
        'delivered',
        'VN87654321',
        195000000,
        1,
        1,
        'Đồng hồ chính hãng, đẹp!',
        'Khách hàng tuyệt vời.',
        CURRENT_TIMESTAMP - INTERVAL '20 days',
        CURRENT_TIMESTAMP - INTERVAL '20 days',
        CURRENT_TIMESTAMP - INTERVAL '19 days',
        CURRENT_TIMESTAMP - INTERVAL '25 days',
        CURRENT_TIMESTAMP - INTERVAL '19 days'
    ),
    -- Order 3: Completed with mixed ratings
    (
        3,
        3,
        7,
        4,
        'completed',
        'COD',
        'completed',
        'TXN003',
        '333 Nguyễn Trãi, Hà Nội',
        'delivered',
        'VN11223344',
        52000000,
        -1,
        1,
        'Giao hàng hơi chậm.',
        'Giao dịch ok.',
        CURRENT_TIMESTAMP - INTERVAL '18 days',
        CURRENT_TIMESTAMP - INTERVAL '18 days',
        CURRENT_TIMESTAMP - INTERVAL '17 days',
        CURRENT_TIMESTAMP - INTERVAL '23 days',
        CURRENT_TIMESTAMP - INTERVAL '17 days'
    ),
    -- Order 4: Pending payment
    (
        4,
        10,
        8,
        2,
        'pending_payment',
        'Bank Transfer',
        'pending',
        NULL,
        '444 Cầu Giấy, Hà Nội',
        'pending',
        NULL,
        31000000,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    -- Order 5: Shipping
    (
        5,
        11,
        9,
        3,
        'shipping',
        'COD',
        'pending',
        NULL,
        '555 Bình Thạnh, HCM',
        'shipped',
        'VN99887766',
        42000000,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    -- Order 6: Completed with negative buyer rating
    (
        6,
        12,
        5,
        4,
        'completed',
        'Bank Transfer',
        'completed',
        'TXN006',
        '111 Trần Hưng Đạo, Q5, HCM',
        'delivered',
        'VN55667788',
        48000000,
        -1,
        1,
        'Hàng không đúng như mô tả.',
        'Khách thanh toán nhanh.',
        CURRENT_TIMESTAMP - INTERVAL '10 days',
        CURRENT_TIMESTAMP - INTERVAL '10 days',
        CURRENT_TIMESTAMP - INTERVAL '9 days',
        CURRENT_TIMESTAMP - INTERVAL '15 days',
        CURRENT_TIMESTAMP - INTERVAL '9 days'
    );

-- Reset sequence for orders
SELECT setval( 'orders_id_seq', ( SELECT MAX(id) FROM orders ) );

-- ================================================
-- 9. WATCHLISTS
-- ================================================
INSERT INTO
    watchlists (user_id, product_id)
VALUES (5, 1),
    (5, 2),
    (5, 7),
    (5, 11),
    (6, 1),
    (6, 3),
    (6, 4),
    (6, 9),
    (7, 2),
    (7, 4),
    (7, 5),
    (7, 8),
    (8, 3),
    (8, 6),
    (8, 10),
    (8, 14),
    (9, 4),
    (9, 5),
    (9, 15);

-- ================================================
-- 10. AUTO BID CONFIGS
-- ================================================
INSERT INTO
    auto_bid_configs (
        user_id,
        product_id,
        max_price,
        is_active
    )
VALUES (5, 1, 34000000, true),
    (5, 4, 20000000, true),
    (6, 2, 200000000, true),
    (7, 4, 22000000, true),
    (7, 5, 28000000, true),
    (8, 1, 33000000, false);

-- ================================================
-- 11. DESCRIPTION HISTORY (Additional descriptions added by sellers)
-- ================================================
INSERT INTO
    product_description_history (
        product_id,
        additional_description,
        created_at
    )
VALUES (
        1,
        'Update: Tặng kèm ốp lưng chính hãng Apple MagSafe trị giá 1.5 triệu cho người thắng đấu giá!',
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        1,
        'Bổ sung: Có thể test máy trực tiếp tại shop Q1 HCM trước khi kết thúc đấu giá.',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        4,
        'Update: Đã thêm hình chụp cận bill mua hàng và tag giày.',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        7,
        'Bổ sung: Xe vừa bảo dưỡng định kỳ tại hãng, có hóa đơn đầy đủ.',
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    );

-- ================================================
-- 12. NOTIFICATIONS (Sample notifications)
-- ================================================
INSERT INTO
    notifications (
        user_id,
        type,
        title,
        message,
        related_product_id,
        is_read,
        created_at
    )
VALUES
    -- Outbid notifications
    (
        5,
        'bid_outbid',
        'Bạn đã bị vượt giá!',
        'Sản phẩm "iPhone 15 Pro Max" đã có người đặt giá cao hơn bạn.',
        1,
        true,
        CURRENT_TIMESTAMP - INTERVAL '6 hours'
    ),
    (
        6,
        'bid_outbid',
        'Bạn đã bị vượt giá!',
        'Sản phẩm "Nike Air Jordan 1" đã có người đặt giá cao hơn bạn.',
        4,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 hours'
    ),
    (
        7,
        'bid_outbid',
        'Bạn đã bị vượt giá!',
        'Sản phẩm "Rolex Submariner" đã có người đặt giá cao hơn bạn.',
        2,
        false,
        CURRENT_TIMESTAMP - INTERVAL '8 hours'
    ),

-- Bid placed notifications
(
    8,
    'bid_placed',
    'Đặt giá thành công!',
    'Bạn đã đặt giá 32.500.000đ cho sản phẩm "iPhone 15 Pro Max".',
    1,
    true,
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
),

-- Question answered
(
    5,
    'question_answered',
    'Câu hỏi được trả lời',
    'Người bán đã trả lời câu hỏi của bạn về sản phẩm "iPhone 15 Pro Max".',
    1,
    true,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
);

-- ================================================
-- DONE! Summary of test data:
-- - 8 parent categories, 28 sub-categories
-- - 9 users (1 admin, 3 sellers, 5 bidders)
-- - 15 products across different categories
-- - 40+ product images
-- - 50+ bids
-- - 10+ questions & answers
-- - 20+ user ratings
-- - 19 watchlist entries
-- - 6 auto-bid configurations
-- ================================================

SELECT 'Seed data inserted successfully!' as status;

SELECT 'Categories: ' || COUNT(*) FROM categories;

SELECT 'Users: ' || COUNT(*) FROM users;

SELECT 'Products: ' || COUNT(*) FROM products;

SELECT 'Product Images: ' || COUNT(*) FROM product_images;

SELECT 'Bids: ' || COUNT(*) FROM bids;

SELECT 'Questions: ' || COUNT(*) FROM product_questions;