-- Test Script for Role Upgrade System
-- Run these queries to verify the 7-day degradation mechanism

-- ================================================
-- 1. SETUP: View current users
-- ================================================
SELECT
    id,
    full_name,
    email,
    role,
    seller_until,
    created_at
FROM users
ORDER BY id;

-- ================================================
-- 2. TEST REQUEST: Check upgrade_requests table
-- ================================================
SELECT ur.id, ur.user_id, u.full_name, u.email, u.role as current_role, ur.status, ur.requested_at, ur.processed_at
FROM upgrade_requests ur
    JOIN users u ON ur.user_id = u.id
ORDER BY ur.requested_at DESC;

-- ================================================
-- 3. TEST APPROVAL: Simulate admin approval
-- ================================================
-- Check users who will become temporary sellers
SELECT
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.seller_until,
    CASE
        WHEN u.seller_until IS NULL THEN 'Permanent or No Expiration'
        WHEN u.seller_until > CURRENT_TIMESTAMP THEN CONCAT(
            'Expires in ',
            EXTRACT(
                DAY
                FROM (
                        u.seller_until - CURRENT_TIMESTAMP
                    )
            ),
            ' days'
        )
        ELSE 'EXPIRED - Will be degraded soon'
    END as status
FROM users u
WHERE
    u.role = 'seller';

-- ================================================
-- 4. TEST DEGRADATION: Check expired sellers
-- ================================================
-- Find sellers whose time has expired (will be degraded by scheduler)
SELECT
    id,
    full_name,
    email,
    role,
    seller_until,
    (
        CURRENT_TIMESTAMP - seller_until
    ) as expired_by
FROM users
WHERE
    role = 'seller'
    AND seller_until IS NOT NULL
    AND seller_until < CURRENT_TIMESTAMP;

-- ================================================
-- 5. MANUAL TEST: Simulate expiration (for testing)
-- ================================================
-- Make a seller expire in 5 minutes (change ID as needed)
-- UNCOMMENT to test:
-- UPDATE users
-- SET seller_until = CURRENT_TIMESTAMP + INTERVAL '5 minutes'
-- WHERE id = 2 AND role = 'seller';

-- Make a seller expire immediately (for instant degradation test)
-- UNCOMMENT to test:
-- UPDATE users
-- SET seller_until = CURRENT_TIMESTAMP - INTERVAL '1 hour'
-- WHERE id = 2 AND role = 'seller';

-- ================================================
-- 6. VERIFY DEGRADATION: Check degraded users
-- ================================================
-- After scheduler runs, verify users are back to bidder
SELECT
    id,
    full_name,
    email,
    role,
    seller_until,
    updated_at
FROM users
WHERE
    role = 'bidder'
    AND seller_until IS NULL
    AND updated_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- ================================================
-- 7. STATS: Overall system health
-- ================================================
SELECT role, COUNT(*) as total, COUNT(
        CASE
            WHEN seller_until IS NOT NULL THEN 1
        END
    ) as temporary, COUNT(
        CASE
            WHEN seller_until IS NULL
            OR role != 'seller' THEN 1
        END
    ) as permanent
FROM users
GROUP BY
    role;

-- ================================================
-- 8. UPCOMING EXPIRATIONS: Next 7 days
-- ================================================
SELECT
    id,
    full_name,
    email,
    role,
    seller_until,
    EXTRACT(
        DAY
        FROM (
                seller_until - CURRENT_TIMESTAMP
            )
    ) as days_remaining,
    EXTRACT(
        HOUR
        FROM (
                seller_until - CURRENT_TIMESTAMP
            )
    ) as hours_remaining
FROM users
WHERE
    role = 'seller'
    AND seller_until IS NOT NULL
    AND seller_until BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP  + INTERVAL '7 days'
ORDER BY seller_until ASC;

-- ================================================
-- 9. CLEANUP: Reset test data (CAREFUL!)
-- ================================================
-- UNCOMMENT to reset all temporary sellers to bidders:
-- UPDATE users SET role = 'bidder', seller_until = NULL WHERE seller_until IS NOT NULL;

-- UNCOMMENT to delete all upgrade requests:
-- DELETE FROM upgrade_requests;