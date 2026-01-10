-- ================================================
-- ADD BIDDING HISTORY - Each product has at least 5 bids
-- ================================================

-- Disable trigger
ALTER TABLE bids DISABLE TRIGGER trigger_increment_bids;

-- Add bids for products that don't have enough (products 3, 6-40)

-- Product 3 - MacBook (needs 7 more bids to reach 12)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        3,
        5,
        46000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        3,
        6,
        47000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '2 hours'
    ),
    (
        3,
        7,
        48000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        3,
        8,
        49000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '4 hours'
    ),
    (
        3,
        5,
        50000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        3,
        6,
        51000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        3,
        7,
        52000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '12 hours'
    );

-- Product 6 - Sony Camera (needs 13 more bids to reach 18)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        6,
        5,
        66000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        6,
        6,
        68000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '3 hours'
    ),
    (
        6,
        7,
        70000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        6,
        8,
        71000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '2 hours'
    ),
    (
        6,
        5,
        72000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        6,
        6,
        73000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '4 hours'
    ),
    (
        6,
        7,
        74000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '6 hours'
    ),
    (
        6,
        8,
        75000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        6,
        5,
        76000000,
        true,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '3 hours'
    ),
    (
        6,
        6,
        77000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '18 hours'
    ),
    (
        6,
        7,
        78000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '10 hours'
    );

-- Product 7 - Mercedes (already has 7 bids, but adding more details)

-- Product 8 - Apartment (needs more)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        8,
        5,
        6100000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '9 days'
    ),
    (
        8,
        6,
        6200000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '8 days'
    ),
    (
        8,
        7,
        6300000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    (
        8,
        8,
        6400000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        8,
        5,
        6500000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    );

-- Product 9 - Painting (needs more)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        9,
        5,
        540000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    (
        9,
        6,
        580000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '6 days'
    ),
    (
        9,
        7,
        620000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        9,
        8,
        660000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        9,
        5,
        680000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        9,
        6,
        700000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        9,
        7,
        720000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    );

-- Product 10 - iPad (needs more)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        10,
        5,
        28500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        10,
        6,
        29000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '2 hours'
    ),
    (
        10,
        7,
        29500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        10,
        8,
        30000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '4 hours'
    ),
    (
        10,
        5,
        30500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '18 hours'
    ),
    (
        10,
        6,
        31000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '10 hours'
    );

-- Product 11 - LV Bag (needs more)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        11,
        5,
        36000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        11,
        6,
        37000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '12 hours'
    ),
    (
        11,
        7,
        38000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        11,
        8,
        39000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '12 hours'
    ),
    (
        11,
        5,
        40000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        11,
        6,
        41000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '18 hours'
    ),
    (
        11,
        7,
        42000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '8 hours'
    );

-- Product 12 - Golf (needs more)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        12,
        5,
        46000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        12,
        6,
        47000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        12,
        7,
        48000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        12,
        8,
        48500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        12,
        5,
        49000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '12 hours'
    );

-- Product 13 - Samsung TV (needs more)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        13,
        5,
        56000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        13,
        6,
        57000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '18 hours'
    ),
    (
        13,
        7,
        58000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        13,
        8,
        58500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '16 hours'
    ),
    (
        13,
        5,
        59000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '8 hours'
    );

-- Product 14 - Honda SH (needs more)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        14,
        5,
        156000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        14,
        6,
        158000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        14,
        7,
        159000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        14,
        8,
        160000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        14,
        5,
        161000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        14,
        6,
        162000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '10 hours'
    );

-- Product 15 - Polymer money (needs more)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES (
        15,
        5,
        12500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '6 days'
    ),
    (
        15,
        6,
        13000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        15,
        7,
        13500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        15,
        8,
        14000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        15,
        5,
        14500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        15,
        6,
        15000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        15,
        7,
        15500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '8 hours'
    );

-- Product 16-23 (Điện thoại category)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES
    -- Product 16 - S24 Ultra
    (
        16,
        5,
        28500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        16,
        6,
        29000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '18 hours'
    ),
    (
        16,
        7,
        29500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        16,
        8,
        30000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '16 hours'
    ),
    (
        16,
        5,
        30500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '8 hours'
    ),

-- Product 17 - iPhone 14 Pro
(
    17,
    5,
    22500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    17,
    6,
    23000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '12 hours'
),
(
    17,
    7,
    23500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    17,
    8,
    24000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    17,
    5,
    24500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '10 hours'
),

-- Product 18 - Xiaomi 14 Ultra
(
    18,
    5,
    20500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    18,
    6,
    21000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '20 hours'
),
(
    18,
    7,
    21500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
),
(
    18,
    8,
    22000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
),
(
    18,
    5,
    22500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
),

-- Product 19 - Pixel 8 Pro
(
    19,
    5,
    18500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    19,
    6,
    19000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '18 hours'
),
(
    19,
    7,
    19500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    19,
    8,
    20000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '16 hours'
),
(
    19,
    5,
    20500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '8 hours'
),

-- Product 20 - OPPO Find X7
(
    20,
    5,
    19500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    20,
    6,
    20000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    20,
    7,
    20500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    20,
    8,
    21000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    20,
    5,
    21500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
),

-- Product 21 - iPhone 13 Pro Max
(
    21,
    5,
    20500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    21,
    6,
    21000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    21,
    7,
    21500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '12 hours'
),
(
    21,
    8,
    22000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    21,
    5,
    22500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '8 hours'
),

-- Product 22 - Z Fold 5
(
    22,
    5,
    36000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    22,
    6,
    36500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    22,
    7,
    37000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    22,
    8,
    37500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    22,
    5,
    38000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),

-- Product 23 - Vivo X100 Pro
(
    23,
    5,
    22500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    23,
    6,
    23000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '18 hours'
),
(
    23,
    7,
    23500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
),
(
    23,
    8,
    24000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
),
(
    23,
    5,
    24500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
);

-- Product 24-31 (Laptop category)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES
    -- Product 24 - Dell XPS
    (
        24,
        5,
        43000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        24,
        6,
        44000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        24,
        7,
        45000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        24,
        8,
        45500000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '12 hours'
    ),
    (
        24,
        5,
        46000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '6 hours'
    ),

-- Product 25 - MacBook Air M2 15
(
    25,
    5,
    33000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    25,
    6,
    33500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '18 hours'
),
(
    25,
    7,
    34000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    25,
    8,
    34500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '16 hours'
),
(
    25,
    5,
    35000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '8 hours'
),

-- Product 26 - ASUS ROG
(
    26,
    5,
    56000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    26,
    6,
    57000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    26,
    7,
    58000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    26,
    8,
    59000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    26,
    5,
    60000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '10 hours'
),

-- Product 27 - ThinkPad
(
    27,
    5,
    39000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    27,
    6,
    40000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    27,
    7,
    41000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    27,
    8,
    42000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    27,
    5,
    43000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),

-- Product 28 - HP Spectre
(
    28,
    5,
    41000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    28,
    6,
    42000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    28,
    7,
    43000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    28,
    8,
    44000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
),
(
    28,
    5,
    45000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 hours'
),

-- Product 29 - Acer Predator
(
    29,
    5,
    36000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    29,
    6,
    36500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '18 hours'
),
(
    29,
    7,
    37000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    29,
    8,
    37500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '16 hours'
),
(
    29,
    5,
    38000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '8 hours'
),

-- Product 30 - Surface Laptop Studio
(
    30,
    5,
    49000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    30,
    6,
    50000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    30,
    7,
    51000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    30,
    8,
    52000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    30,
    5,
    53000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '10 hours'
),

-- Product 31 - LG Gram
(
    31,
    5,
    39000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    31,
    6,
    39500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '18 hours'
),
(
    31,
    7,
    40000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
),
(
    31,
    8,
    40500000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
),
(
    31,
    5,
    41000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
);

-- Product 32-40 (Ô tô category)
INSERT INTO
    bids (
        product_id,
        user_id,
        bid_price,
        is_auto,
        created_at
    )
VALUES
    -- Product 32 - Camry
    (
        32,
        5,
        1160000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '6 days'
    ),
    (
        32,
        6,
        1170000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        32,
        7,
        1180000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        32,
        8,
        1190000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        32,
        5,
        1200000000,
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),

-- Product 33 - CR-V
(
    33,
    5,
    1260000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    33,
    6,
    1270000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '12 hours'
),
(
    33,
    7,
    1280000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    33,
    8,
    1290000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    33,
    5,
    1300000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
),

-- Product 34 - Mazda CX-5
(
    34,
    5,
    990000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    34,
    6,
    1000000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    34,
    7,
    1010000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    34,
    8,
    1020000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    34,
    5,
    1030000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),

-- Product 35 - BMW
(
    35,
    5,
    2120000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '7 days'
),
(
    35,
    6,
    2150000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '6 days'
),
(
    35,
    7,
    2180000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    35,
    8,
    2200000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    35,
    5,
    2250000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),

-- Product 36 - Audi Q7
(
    36,
    5,
    3250000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '8 days'
),
(
    36,
    6,
    3300000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '7 days'
),
(
    36,
    7,
    3350000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '6 days'
),
(
    36,
    8,
    3400000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    36,
    5,
    3450000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),

-- Product 37 - VinFast VF8
(
    37,
    5,
    860000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    37,
    6,
    870000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    37,
    7,
    880000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    37,
    8,
    890000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '12 hours'
),
(
    37,
    5,
    900000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),

-- Product 38 - Tucson
(
    38,
    5,
    960000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    38,
    6,
    970000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    38,
    7,
    980000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    38,
    8,
    990000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    38,
    5,
    1000000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),

-- Product 39 - Sorento
(
    39,
    5,
    1190000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    39,
    6,
    1200000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '18 hours'
),
(
    39,
    7,
    1210000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    39,
    8,
    1220000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '16 hours'
),
(
    39,
    5,
    1230000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '8 hours'
),

-- Product 40 - Ranger Raptor
(
    40,
    5,
    1460000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '6 days'
),
(
    40,
    6,
    1480000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    40,
    7,
    1500000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    40,
    8,
    1520000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    40,
    5,
    1540000000,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
);

-- Re-enable trigger
ALTER TABLE bids ENABLE TRIGGER trigger_increment_bids;

SELECT 'All products now have at least 5 bids!' as status;

SELECT COUNT(*) as total_bids FROM bids;