-- Migration: Add Google OAuth support to users table
-- Run this after init.sql or on existing database

-- Add columns for Google authentication
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local' CHECK (
    auth_provider IN ('local', 'google')
),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Make password_hash optional for Google users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for faster Google ID lookup
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);

CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users (auth_provider);

-- Add comments
COMMENT ON COLUMN users.google_id IS 'Google OAuth unique identifier';

COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: local (email/password) or google';

COMMENT ON COLUMN users.avatar_url IS 'User profile picture URL (from Google or uploaded)';

-- Display results
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'users'
    AND column_name IN (
        'google_id',
        'auth_provider',
        'avatar_url',
        'password_hash'
    )
ORDER BY ordinal_position;