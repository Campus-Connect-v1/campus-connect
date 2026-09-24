-- ============================================================================
-- Which of migrations 004-009 are applied?
-- ----------------------------------------------------------------------------
-- There is no migration runner and no tracking table, so the only way to know
-- what a database has is to look for the objects each migration creates.
--
-- READ ONLY. Every statement reads information_schema and nothing else, so
-- this is safe to run against production.
--
--   mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" \
--     < server/db/check_migrations.sql
--
-- Anything reported as MISSING should be applied in ascending order. Every
-- migration in this directory is written to be idempotent, so re-running one
-- that is already applied is safe if you are unsure.
-- ============================================================================

SELECT '004_push_tokens' AS migration,
       IF(COUNT(*) = 1, 'applied', 'MISSING') AS state,
       'table user_push_tokens' AS looks_for
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_push_tokens'

UNION ALL
SELECT '005_comment_likes_and_saved_posts',
       IF(COUNT(*) = 2, 'applied', 'MISSING'),
       'tables comment_likes + saved_posts'
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('comment_likes','saved_posts')

UNION ALL
-- Enum widening leaves no table behind, so check the column type itself.
SELECT '006_notification_broadcast_types',
       IF(COUNT(*) = 1, 'applied', 'MISSING'),
       'notifications.type includes new_post + event_created'
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
   AND COLUMN_NAME = 'type'
   AND COLUMN_TYPE LIKE '%new_post%' AND COLUMN_TYPE LIKE '%event_created%'

UNION ALL
SELECT '007_follows',
       IF(COUNT(*) = 1, 'applied', 'MISSING'),
       'table follows -- load bearing for the feed'
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'follows'

UNION ALL
-- 008 touches three tables; all three parts are checked, because a partial
-- apply is the failure worth catching.
SELECT '008_notification_quality',
       IF(COUNT(*) = 3, 'applied', 'MISSING'),
       'push_receipts + notifications.actor_count + users.quiet_hours_start'
  FROM (
        SELECT 1 FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'push_receipts'
        UNION ALL
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
           AND COLUMN_NAME = 'actor_count'
        UNION ALL
        SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
           AND COLUMN_NAME = 'quiet_hours_start'
       ) AS parts

UNION ALL
SELECT '009_post_university_visibility',
       IF(COUNT(*) = 1, 'applied', 'MISSING'),
       'posts.visibility includes university'
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts'
   AND COLUMN_NAME = 'visibility' AND COLUMN_TYPE LIKE '%university%';
