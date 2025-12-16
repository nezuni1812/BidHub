-- Migration: Add seller_until column for temporary seller role
-- Date: 2024
-- Purpose: Enable automatic degradation of temporary sellers after 7 days

-- Add seller_until column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS seller_until TIMESTAMP NULL;

-- Comment for documentation
COMMENT ON COLUMN users.seller_until IS 'Timestamp when temporary seller role expires. NULL means permanent seller or not applicable.';

-- Create index for faster cleanup job queries
CREATE INDEX IF NOT EXISTS idx_users_seller_expiration ON users (seller_until)
WHERE
    seller_until IS NOT NULL;

-- Show confirmation
SELECT 'Migration completed: seller_until column added to users table' AS status;