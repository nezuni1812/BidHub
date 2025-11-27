-- Simple seed data for testing BidHub API

-- Insert products with explicit IDs and valid prices
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
        end_time,
        status,
        total_bids
    )
VALUES
    -- Ending soon
    (
        1,
        2,
        9,
        'iPhone 15 Pro Max 256GB',
        'iPhone 15 Pro Max màu Titan, 256GB. Bảo hành Apple đến 6/2025. Pin 98%.',
        25000000,
        32500000,
        35000000,
        500000,
        CURRENT_TIMESTAMP + INTERVAL '2 hours',
        'active',
        15
    ),
    (
        2,
        3,
        15,
        'Rolex Submariner Date',
        'Rolex chính hãng, fullbox. Mua 2023, còn bảo hành.',
        180000000,
        195000000,
        220000000,
        5000000,
        CURRENT_TIMESTAMP + INTERVAL '5 hours',
        'active',
        8
    ),
    (
        3,
        4,
        10,
        'MacBook Pro M3 14 inch',
        'MacBook Pro M3 Pro, 18GB RAM, 512GB SSD. Space Black. Mới 99%.',
        45000000,
        52000000,
        58000000,
        1000000,
        CURRENT_TIMESTAMP + INTERVAL '8 hours',
        'active',
        12
    ),

-- Most bids
(
    2,
    17,
    'Nike Air Jordan 1 Retro High',
    'Air Jordan 1 "Chicago" 2022, Size 42. Deadstock, fullbox.',
    8000000,
    18500000,
    25000000,
    500000,
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'active',
    28
),
(
    3,
    31,
    'LEGO Star Wars Millennium Falcon',
    'LEGO 75192 với 7541 chi tiết. Hộp seal, phiên bản giới hạn.',
    15000000,
    24000000,
    30000000,
    500000,
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    'active',
    22
),

-- Highest prices
(
    4,
    13,
    'Sony A7 IV + Lens 24-70mm f/2.8',
    'Combo Sony A7 IV + lens GM II. Máy 99%, shutter 5000. Tặng thẻ 128GB.',
    65000000,
    78000000,
    85000000,
    2000000,
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    18
),
(
    2,
    24,
    'Mercedes-Benz S450 Luxury 2023',
    'Mercedes S450 màu đen, 8000km. Biển đẹp. Full option.',
    3500000000,
    3850000000,
    4200000000,
    50000000,
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'active',
    7
),
(
    3,
    28,
    'Tranh Bùi Xuân Phái "Phố cổ Hà Nội"',
    'Tranh sơn dầu nguyên bản, 80x100cm. Có chứng nhận.',
    500000000,
    720000000,
    900000000,
    20000000,
    CURRENT_TIMESTAMP + INTERVAL '6 days',
    'active',
    11
),

-- More variety
(
    2,
    11,
    'iPad Pro M2 12.9 inch + Apple Pencil',
    'iPad Pro M2, 256GB + Pencil 2 + Magic Keyboard. Pin 95%.',
    28000000,
    31000000,
    35000000,
    500000,
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    'active',
    9
),
(
    3,
    16,
    'Túi Louis Vuitton Neverfull MM',
    'LV Neverfull Monogram. Chính hãng từ Paris. Fullbox. Mới 95%.',
    35000000,
    42000000,
    50000000,
    1000000,
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    14
),
(
    4,
    34,
    'Bộ gậy golf Titleist T200',
    'Titleist T200 Iron Set (5-PW). Shaft KBS Tour. Như mới.',
    45000000,
    48000000,
    55000000,
    1000000,
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    'active',
    6
),
(
    2,
    14,
    'Samsung OLED TV 65 inch S95C',
    'Samsung OLED 65" S95C 2024. QD-OLED, 2000 nits. Bảo hành 24 tháng.',
    55000000,
    58000000,
    65000000,
    1000000,
    CURRENT_TIMESTAMP + INTERVAL '6 days',
    'active',
    4
),
(
    3,
    25,
    'Honda SH 350i 2024 ABS',
    'SH 350i màu đen nhám. Xe mới 100%. ABS, Smartkey. BH 3 năm.',
    155000000,
    162000000,
    175000000,
    2000000,
    CURRENT_TIMESTAMP + INTERVAL '4 days',
    'active',
    10
),
(
    4,
    29,
    'Bộ tiền Polymer Việt Nam 2003-2023',
    'Bộ sưu tập tiền Polymer đầy đủ. Serial đẹp. UNC.',
    12000000,
    15500000,
    20000000,
    500000,
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'active',
    13
),
(
    2,
    21,
    'Bộ sofa da thật Italia',
    'Sofa da bò Italia 3+2 chỗ. Màu nâu cafe. Như mới 95%.',
    85000000,
    92000000,
    105000000,
    2000000,
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'active',
    7
);

-- Product images
INSERT INTO
    product_images (product_id, url, is_main)
VALUES (
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
        5,
        'https://picsum.photos/seed/lego1/800/600',
        true
    ),
    (
        5,
        'https://picsum.photos/seed/lego2/800/600',
        false
    ),
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
        8,
        'https://picsum.photos/seed/painting1/800/600',
        true
    ),
    (
        9,
        'https://picsum.photos/seed/ipad1/800/600',
        true
    ),
    (
        10,
        'https://picsum.photos/seed/lv1/800/600',
        true
    ),
    (
        10,
        'https://picsum.photos/seed/lv2/800/600',
        false
    ),
    (
        11,
        'https://picsum.photos/seed/golf1/800/600',
        true
    ),
    (
        12,
        'https://picsum.photos/seed/tv1/800/600',
        true
    ),
    (
        13,
        'https://picsum.photos/seed/sh1/800/600',
        true
    ),
    (
        13,
        'https://picsum.photos/seed/sh2/800/600',
        false
    ),
    (
        14,
        'https://picsum.photos/seed/money1/800/600',
        true
    ),
    (
        15,
        'https://picsum.photos/seed/sofa1/800/600',
        true
    ),
    (
        15,
        'https://picsum.photos/seed/sofa2/800/600',
        false
    );

-- Bids for products
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES
    -- iPhone bids
    (
        1,
        5,
        26000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        1,
        6,
        26500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        1,
        7,
        27000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        1,
        5,
        28000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        1,
        8,
        29000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        1,
        6,
        30000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '12 hours'
    ),
    (
        1,
        5,
        31000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '8 hours'
    ),
    (
        1,
        8,
        32500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '6 hours'
    ),

-- Rolex bids
(
    2,
    6,
    182000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    2,
    8,
    185000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    2,
    5,
    190000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    2,
    6,
    195000000,
    true,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),

-- Air Jordan bids (most bids)
(
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
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    4,
    5,
    11000000,
    true,
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '2 hours'
),
(
    4,
    6,
    12000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '4 hours'
),
(
    4,
    7,
    13000000,
    true,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    4,
    8,
    14000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '2 hours'
),
(
    4,
    5,
    15000000,
    true,
    CURRENT_TIMESTAMP - INTERVAL '20 hours'
),
(
    4,
    6,
    16000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '15 hours'
),
(
    4,
    7,
    17000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '10 hours'
),
(
    4,
    8,
    18500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 hours'
);

-- Product questions
INSERT INTO
    product_questions (
        product_id,
        user_id,
        question,
        answer,
        created_at,
        answered_at
    )
VALUES (
        1,
        5,
        'Máy có bị rơi vỡ hay ngấm nước chưa ạ?',
        'Chưa bạn nhé, máy còn rất mới.',
        CURRENT_TIMESTAMP - INTERVAL '4 days',
        CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '2 hours'
    ),
    (
        1,
        6,
        'Pin có bị chai không ạ?',
        'Pin 98% như mô tả bạn.',
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 hour'
    ),
    (
        2,
        8,
        'Đồng hồ có bị sửa chữa chưa?',
        'Nguyên bản 100% bạn nhé.',
        CURRENT_TIMESTAMP - INTERVAL '4 days',
        CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '1 hour'
    ),
    (
        4,
        9,
        'Có size 43 không shop?',
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        NULL
    ),
    (
        7,
        5,
        'Xe có tai nạn chưa ạ?',
        'Xe nguyên zin, check hãng full lịch sử.',
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '3 hours'
    );

-- User ratings
INSERT INTO
    user_ratings (
        rater_id,
        rated_user_id,
        score,
        comment,
        created_at
    )
VALUES (
        5,
        2,
        5,
        'Giao hàng nhanh, đóng gói cẩn thận!',
        CURRENT_TIMESTAMP - INTERVAL '30 days'
    ),
    (
        6,
        2,
        5,
        'Shop uy tín, sản phẩm đúng mô tả.',
        CURRENT_TIMESTAMP - INTERVAL '25 days'
    ),
    (
        7,
        2,
        4,
        'Sản phẩm tốt, giao hơi chậm.',
        CURRENT_TIMESTAMP - INTERVAL '20 days'
    ),
    (
        5,
        3,
        4,
        'Hàng ok, đóng gói tốt.',
        CURRENT_TIMESTAMP - INTERVAL '28 days'
    ),
    (
        6,
        3,
        5,
        'Rất hài lòng với sản phẩm.',
        CURRENT_TIMESTAMP - INTERVAL '22 days'
    ),
    (
        5,
        4,
        5,
        'Sản phẩm chất lượng cao, giá tốt.',
        CURRENT_TIMESTAMP - INTERVAL '26 days'
    ),
    (
        6,
        4,
        5,
        'Shop rất uy tín, recommend!',
        CURRENT_TIMESTAMP - INTERVAL '21 days'
    ),
    (
        2,
        5,
        4,
        'Thanh toán nhanh, giao dịch suôn sẻ.',
        CURRENT_TIMESTAMP - INTERVAL '24 days'
    ),
    (
        2,
        6,
        5,
        'Khách hàng tuyệt vời!',
        CURRENT_TIMESTAMP - INTERVAL '23 days'
    ),
    (
        2,
        8,
        5,
        'Khách hàng thân thiện!',
        CURRENT_TIMESTAMP - INTERVAL '20 days'
    );

SELECT '✅ Data inserted successfully!' as status;

SELECT 'Categories: ' || COUNT(*) || ' (already exists from init.sql)' as info
FROM categories;

SELECT 'Users: ' || COUNT(*) || ' (sellers: user 2,3,4 | bidders: user 5,6,7,8,9)' as info
FROM users;

SELECT 'Products: ' || COUNT(*) as info FROM products;

SELECT 'Images: ' || COUNT(*) as info FROM product_images;

SELECT 'Bids: ' || COUNT(*) as info FROM bids;

SELECT 'Questions: ' || COUNT(*) as info FROM product_questions;

SELECT 'Ratings: ' || COUNT(*) as info FROM user_ratings;