-- Tạo database (chỉ chạy nếu chưa có)
-- CREATE DATABASE auction_app;

-- Kết nối vào database auction_app
-- \c auction_app;

-- Bảng Category
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories
ADD CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL;

-- Bảng User
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(20) DEFAULT 'bidder' CHECK (
        role IN ('bidder', 'seller', 'admin')
    ),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255), -- Optional for OAuth users
    address TEXT,
    date_of_birth DATE,
    rating DECIMAL(3, 2) DEFAULT 0 CHECK (
        rating >= 0
        AND rating <= 5
    ),
    otp_code VARCHAR(10),
    otp_expired_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    -- Google OAuth fields
    google_id VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(20) DEFAULT 'email' CHECK (
        auth_provider IN ('email', 'google')
    ),
    -- Seller expiration: NULL = permanent, TIMESTAMP = expires at this time
    seller_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster Google OAuth lookups
CREATE INDEX idx_users_google_id ON users (google_id);

-- Bảng Product
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_price DECIMAL(12, 2) NOT NULL CHECK (start_price > 0),
    current_price DECIMAL(12, 2) NOT NULL CHECK (current_price >= start_price),
    buy_now_price DECIMAL(12, 2) CHECK (
        buy_now_price IS NULL
        OR buy_now_price > start_price
    ),
    bid_step DECIMAL(12, 2) DEFAULT 10000 CHECK (bid_step > 0),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL CHECK (end_time > start_time),
    status VARCHAR(20) DEFAULT 'active' CHECK (
        status IN (
            'active',
            'completed',
            'cancelled',
            'pending'
        )
    ),
    auto_extend BOOLEAN DEFAULT FALSE,
    winner_id BIGINT,
    total_bids INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_id) REFERENCES users (id) ON DELETE SET NULL
);

ALTER TABLE products
ADD CONSTRAINT fk_product_seller FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE products
ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT;

-- Bảng Product Images
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE product_images
ADD CONSTRAINT fk_image_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE;

-- Bảng Bids
CREATE TABLE bids (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    bid_price DECIMAL(12, 2) NOT NULL CHECK (bid_price > 0),
    is_auto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bids
ADD CONSTRAINT fk_bid_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE;

ALTER TABLE bids
ADD CONSTRAINT fk_bid_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

CREATE INDEX idx_bids_product_id ON bids (product_id);

CREATE INDEX idx_bids_user_id ON bids (user_id);

CREATE INDEX idx_bids_created_at ON bids (created_at DESC);

-- Bảng Watchlist
CREATE TABLE watchlists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);

ALTER TABLE watchlists
ADD CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE watchlists
ADD CONSTRAINT fk_watchlist_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE;

-- Bảng Product Questions
CREATE TABLE product_questions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_questions_product_id ON product_questions (product_id);

-- Bảng User Ratings
CREATE TABLE user_ratings (
    id BIGSERIAL PRIMARY KEY,
    rater_id BIGINT NOT NULL,
    rated_user_id BIGINT NOT NULL,
    product_id BIGINT,
    score SMALLINT NOT NULL CHECK (
        score >= 1
        AND score <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rater_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (rated_user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
);

CREATE INDEX idx_ratings_rated_user ON user_ratings (rated_user_id);

-- Bảng Upgrade Requests
-- Bảng Upgrade Requests
CREATE TABLE upgrade_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'approved',
            'rejected'
        )
    ),
    admin_note TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by BIGINT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users (id) ON DELETE SET NULL
);

-- Bảng Denied Bidders
CREATE TABLE denied_bidders (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, user_id),
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Bảng Unrated Bidder Permissions (Seller allows unrated bidders to bid)
CREATE TABLE unrated_bidder_permissions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    bidder_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, bidder_id),
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_unrated_permissions_product ON unrated_bidder_permissions (product_id);

CREATE INDEX idx_unrated_permissions_bidder ON unrated_bidder_permissions (bidder_id);

-- Bảng Refresh Tokens (JWT Security)
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);

CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- Bảng Orders
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    order_status VARCHAR(20) DEFAULT 'pending_payment' CHECK (
        order_status IN (
            'pending_payment',
            'paid',
            'shipping',
            'delivered',
            'cancelled',
            'refunded',
            'completed'
        )
    ),
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) CHECK (
        payment_status IN (
            'pending',
            'processing',
            'completed',
            'failed',
            'refunded'
        )
    ),
    payment_transaction_id VARCHAR(255),
    shipping_address TEXT,
    shipping_status VARCHAR(20) CHECK (
        shipping_status IN (
            'pending',
            'preparing',
            'shipped',
            'in_transit',
            'delivered',
            'returned'
        )
    ),
    tracking_number VARCHAR(255),
    total_price DECIMAL(12, 2) CHECK (total_price > 0),
    buyer_rating SMALLINT CHECK (buyer_rating IN (-1, 1)),
    seller_rating SMALLINT CHECK (seller_rating IN (-1, 1)),
    buyer_comment TEXT,
    seller_comment TEXT,
    buyer_rated_at TIMESTAMP,
    seller_rated_at TIMESTAMP,
    cancelled_by BIGINT,
    cancel_reason TEXT,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE RESTRICT,
    FOREIGN KEY (cancelled_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_buyer_id ON orders (buyer_id);

CREATE INDEX idx_orders_seller_id ON orders (seller_id);

CREATE INDEX idx_orders_status ON orders (order_status);

CREATE INDEX idx_orders_payment_status ON orders (payment_status);

CREATE INDEX idx_orders_shipping_status ON orders (shipping_status);

-- Bảng Notifications (Mailing System)
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (
        type IN (
            'bid_placed',
            'bid_outbid',
            'bid_won',
            'auction_ended_no_buyer',
            'auction_ended_winner',
            'bidder_denied',
            'question_asked',
            'question_answered',
            'order_payment',
            'order_shipped',
            'order_delivered',
            'upgrade_approved',
            'upgrade_rejected'
        )
    ),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_product_id BIGINT,
    related_order_id BIGINT,
    related_user_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    is_sent_email BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (related_product_id) REFERENCES products (id) ON DELETE SET NULL,
    FOREIGN KEY (related_order_id) REFERENCES orders (id) ON DELETE SET NULL,
    FOREIGN KEY (related_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);

CREATE INDEX idx_notifications_type ON notifications (type);

CREATE INDEX idx_notifications_is_read ON notifications (is_read);

CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- Bảng Auto Bid Configs (Đấu giá tự động)
CREATE TABLE auto_bid_configs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    max_price DECIMAL(12, 2) NOT NULL CHECK (max_price > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    UNIQUE (user_id, product_id)
);

CREATE INDEX idx_auto_bid_user_id ON auto_bid_configs (user_id);

CREATE INDEX idx_auto_bid_product_id ON auto_bid_configs (product_id);

CREATE INDEX idx_auto_bid_is_active ON auto_bid_configs (is_active);

-- Bảng Product Description History (Lịch sử bổ sung mô tả)
CREATE TABLE product_description_history (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    additional_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX idx_description_history_product_id ON product_description_history (product_id);

CREATE INDEX idx_description_history_created_at ON product_description_history (created_at DESC);

-- Bảng System Settings (Cấu hình hệ thống cho admin)
CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_system_settings_key ON system_settings (setting_key);

-- Insert default system settings
INSERT INTO
    system_settings (
        setting_key,
        setting_value,
        description
    )
VALUES (
        'auto_extend_threshold_minutes',
        '5',
        'Thời gian trước khi kết thúc để tự động gia hạn (phút)'
    ),
    (
        'auto_extend_duration_minutes',
        '10',
        'Thời gian gia hạn thêm khi có bid mới (phút)'
    ),
    (
        'new_product_highlight_minutes',
        '60',
        'Thời gian sản phẩm mới được highlight (phút)'
    ),
    (
        'min_rating_percentage',
        '80',
        'Tỷ lệ đánh giá tối thiểu để được phép đấu giá (%)'
    ),
    (
        'payment_timeout_hours',
        '24',
        'Thời gian thanh toán tối đa sau khi thắng đấu giá (giờ)'
    ),
    (
        'allow_unrated_bidders',
        'true',
        'Cho phép bidder chưa có đánh giá tham gia đấu giá'
    );

-- Bảng Chat Messages
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_order_id ON chat_messages (order_id);

CREATE INDEX idx_messages_created_at ON chat_messages (created_at);

-- Thêm indexes cho performance
CREATE INDEX idx_products_seller_id ON products (seller_id);

CREATE INDEX idx_products_category_id ON products (category_id);

CREATE INDEX idx_products_status ON products (status);

CREATE INDEX idx_products_end_time ON products (end_time);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_role ON users (role);

-- Tạo function để tự động update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tạo triggers cho updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_bid_configs_updated_at BEFORE UPDATE ON auto_bid_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function để tự động tăng total_bids khi có bid mới
CREATE OR REPLACE FUNCTION increment_product_bids()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET total_bids = total_bids + 1,
        current_price = NEW.bid_price,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_increment_bids AFTER INSERT ON bids
    FOR EACH ROW EXECUTE FUNCTION increment_product_bids();

-- Function để update rating của user
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
    total_ratings INTEGER;
    positive_ratings INTEGER;
    new_rating DECIMAL(3,2);
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE score > 0)
    INTO total_ratings, positive_ratings
    FROM user_ratings
    WHERE rated_user_id = NEW.rated_user_id;
    
    IF total_ratings > 0 THEN
        new_rating := (positive_ratings::DECIMAL / total_ratings::DECIMAL) * 5;
        UPDATE users 
        SET rating = new_rating,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.rated_user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_user_rating AFTER INSERT OR UPDATE ON user_ratings
    FOR EACH ROW EXECUTE FUNCTION update_user_rating();