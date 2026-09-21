-- ============================================================================
-- Migration 001 — align an existing campus_connect database with the app
-- ----------------------------------------------------------------------------
-- For databases built from campus_connect.sql (the Oct 2025 phpMyAdmin dump).
-- Brings them to the same shape as db/init.sql.
--
-- A NEW database does not need this: db/init.sql already includes everything.
--
-- Idempotent: every step checks information_schema first, so re-running is a
-- no-op. Safe to run more than once, and safe to run on a partially-migrated
-- database.
--
--   mysql -h <host> -u <admin> -p campus_connect < db/migrations/001_align_with_app.sql
--
-- Take a backup first:
--   mysqldump -h <host> -u <admin> -p campus_connect > backup_before_001.sql
--
-- READ THIS BEFORE RUNNING
--   Step 5 deletes all rows from `otps`. Codes were stored in plaintext and are
--   now bcrypt hashes; old rows can never verify. Anyone mid-signup must
--   request a new code. Run at a quiet time, or accept the few resends.
-- ============================================================================

SET NAMES utf8mb4;

-- Every DDL step follows the same shape: count what is already there, build the
-- statement only if it is missing, execute. MySQL has no ADD COLUMN IF NOT
-- EXISTS, so this is the portable way to stay re-runnable.

-- ----------------------------------------------------------------------------
-- 1. users / user_archive: OAuth columns the app writes but the dump lacks
--    models/auth.model.js createUser() inserts all three. Without them,
--    registration fails outright.
-- ----------------------------------------------------------------------------

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'
                AND COLUMN_NAME='auth_provider') = 0,
  "ALTER TABLE `users` ADD COLUMN `auth_provider` enum('email','google') NOT NULL DEFAULT 'email' AFTER `gender`",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'
                AND COLUMN_NAME='provider_id') = 0,
  "ALTER TABLE `users` ADD COLUMN `provider_id` varchar(255) DEFAULT NULL AFTER `auth_provider`",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'
                AND COLUMN_NAME='is_edu_verified') = 0,
  "ALTER TABLE `users` ADD COLUMN `is_edu_verified` tinyint(1) DEFAULT '0' AFTER `provider_id`",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_archive'
                AND COLUMN_NAME='auth_provider') = 0,
  "ALTER TABLE `user_archive` ADD COLUMN `auth_provider` enum('email','google') NOT NULL DEFAULT 'email' AFTER `gender`",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_archive'
                AND COLUMN_NAME='provider_id') = 0,
  "ALTER TABLE `user_archive` ADD COLUMN `provider_id` varchar(255) DEFAULT NULL AFTER `auth_provider`",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_archive'
                AND COLUMN_NAME='is_edu_verified') = 0,
  "ALTER TABLE `user_archive` ADD COLUMN `is_edu_verified` tinyint(1) DEFAULT '0' AFTER `provider_id`",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Lookup index for findUserByProvider(): WHERE auth_provider = ? AND provider_id = ?
SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'
                AND INDEX_NAME='idx_auth_provider') = 0,
  "ALTER TABLE `users` ADD KEY `idx_auth_provider` (`auth_provider`,`provider_id`)",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ----------------------------------------------------------------------------
-- 2. password_hash must allow NULL
--    OAuth users never set a password. The column was NOT NULL, so the Google
--    signup path could not insert at all.
-- ----------------------------------------------------------------------------

SET @s := IF((SELECT IS_NULLABLE FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'
                AND COLUMN_NAME='password_hash') = 'NO',
  "ALTER TABLE `users` MODIFY `password_hash` varchar(255) DEFAULT NULL",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT IS_NULLABLE FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_archive'
                AND COLUMN_NAME='password_hash') = 'NO',
  "ALTER TABLE `user_archive` MODIFY `password_hash` varchar(255) DEFAULT NULL",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ----------------------------------------------------------------------------
-- 3. Drop the connection_recommendations view
--    Its mutual-friend subquery required c1.requester_id = u1.user_id in both
--    OR branches, so a mutual friend only counted when the source user had SENT
--    the request -- roughly half of all friendships were invisible to it.
--    getConnectionRecommendationsModel() now queries base tables instead.
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS `connection_recommendations`;

-- ----------------------------------------------------------------------------
-- 4. Drop the dead user_connections table
--    Superseded by `connections`. No code in server/ references it.
--
--    SAFETY: this is skipped automatically if the table has rows, so the
--    migration can never silently delete connection data. If the count is
--    non-zero, inspect it and drop by hand once you are satisfied.
-- ----------------------------------------------------------------------------

SET @rows := IF((SELECT COUNT(*) FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_connections') = 0,
                0,
                (SELECT COUNT(*) FROM `user_connections`));

SET @s := IF(@rows = 0, "DROP TABLE IF EXISTS `user_connections`", "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT IF(@rows = 0,
          'user_connections: dropped (was empty)',
          CONCAT('user_connections: KEPT -- it holds ', @rows,
                 ' row(s). Review and drop manually.')) AS `step_4`;

-- ----------------------------------------------------------------------------
-- 5. otps: store a bcrypt hash, and cap guessing
--    Existing rows are plaintext codes and can never match a hash, so they are
--    removed. Anyone mid-verification requests a new code.
-- ----------------------------------------------------------------------------

DELETE FROM `otps`;

SET @s := IF((SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='otps'
                AND COLUMN_NAME='otp_code') < 255,
  "ALTER TABLE `otps` MODIFY `otp_code` varchar(255) NOT NULL",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='otps'
                AND COLUMN_NAME='attempts') = 0,
  "ALTER TABLE `otps` ADD COLUMN `attempts` int NOT NULL DEFAULT '0' AFTER `otp_code`",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ----------------------------------------------------------------------------
-- 6. Drop redundant indexes
--    Each duplicates the left prefix of an existing UNIQUE key, so it costs
--    writes and buys nothing. Purely an optimisation -- skip this section if
--    you would rather not touch indexes during the migration.
-- ----------------------------------------------------------------------------

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND INDEX_NAME='idx_email') > 0,
  "ALTER TABLE `users` DROP INDEX `idx_email`", "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_courses' AND INDEX_NAME='idx_user_id') > 0,
  "ALTER TABLE `user_courses` DROP INDEX `idx_user_id`", "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='group_members' AND INDEX_NAME='idx_group_id') > 0,
  "ALTER TABLE `group_members` DROP INDEX `idx_group_id`", "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='post_likes' AND INDEX_NAME='idx_post_id') > 0,
  "ALTER TABLE `post_likes` DROP INDEX `idx_post_id`", "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT 'migration 001 complete' AS `status`;
