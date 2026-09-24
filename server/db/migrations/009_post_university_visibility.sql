-- ============================================================================
-- Migration 009 — campus-wide post visibility
-- ----------------------------------------------------------------------------
--   mysql -h <host> -u <user> -p <database> < db/migrations/009_post_university_visibility.sql
--
-- Idempotent; safe to re-run.
--
-- The poll composer has always offered three audiences -- Public, Connections
-- and "Campus" -- and sends 'university' for the third. posts.visibility was
-- enum('public','connections','private'), so choosing Campus wrote a value the
-- column could not hold: a hard error under strict mode, and silently '' under
-- the non-strict setting this database actually runs.
--
-- Widening rather than removing the option, because a campus-wide audience is
-- the point of the product and stories.visibility already carries it -- posts
-- were simply the table that never caught up.
--
-- 'private' is kept even though nothing writes it: rows may already hold it,
-- and an ENUM MODIFY that drops a value truncates those rows to ''.
-- ============================================================================

SET NAMES utf8mb4;

ALTER TABLE `posts`
  MODIFY COLUMN `visibility`
  enum('public','connections','university','private') DEFAULT 'connections';

SELECT 'migration 009 complete' AS `status`,
       (SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'posts'
           AND COLUMN_NAME = 'visibility') AS `visibility_enum`;
