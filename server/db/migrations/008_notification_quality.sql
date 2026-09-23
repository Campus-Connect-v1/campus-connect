-- ============================================================================
-- Migration 008 — notification bundling, delivery receipts, quiet hours
-- ----------------------------------------------------------------------------
--   mysql -h <host> -u <user> -p <database> < db/migrations/008_notification_quality.sql
--
-- Idempotent; safe to re-run. Every statement is guarded, because ADD COLUMN
-- and ADD INDEX are not idempotent in MySQL/MariaDB the way CREATE TABLE
-- IF NOT EXISTS is, and a half-applied migration is worse than none.
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- 1. Bundling
--
-- notify() suppresses an identical unread notification inside a 60s window,
-- which stops double-taps but cannot turn five likers into one line. Ten likes
-- on a popular post are ten rows and ten pushes, and unbundled social
-- notifications are the fastest route to someone turning them off entirely.
--
-- actor_count carries "and N others"; last_pushed_at lets a bundle push again
-- later without pushing on every single increment.
-- ----------------------------------------------------------------------------
SET @add_actor_count := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
      AND COLUMN_NAME = 'actor_count') = 0,
  'ALTER TABLE `notifications` ADD COLUMN `actor_count` int NOT NULL DEFAULT 1 AFTER `actor_id`',
  'SELECT "actor_count exists" AS skipped'
);
PREPARE s FROM @add_actor_count; EXECUTE s; DEALLOCATE PREPARE s;

SET @add_last_pushed := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
      AND COLUMN_NAME = 'last_pushed_at') = 0,
  'ALTER TABLE `notifications` ADD COLUMN `last_pushed_at` timestamp NULL DEFAULT NULL',
  'SELECT "last_pushed_at exists" AS skipped'
);
PREPARE s FROM @add_last_pushed; EXECUTE s; DEALLOCATE PREPARE s;

-- The bundle lookup: "is there an unread notification of this type, for this
-- recipient, about this resource, recently?" -- run on every notify().
SET @add_bundle_idx := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
      AND INDEX_NAME = 'idx_bundle_lookup') = 0,
  'ALTER TABLE `notifications` ADD INDEX `idx_bundle_lookup` (`user_id`,`type`,`resource_id`,`is_read`,`created_at`)',
  'SELECT "idx_bundle_lookup exists" AS skipped'
);
PREPARE s FROM @add_bundle_idx; EXECUTE s; DEALLOCATE PREPARE s;

-- ----------------------------------------------------------------------------
-- 2. Delivery receipts
--
-- Expo's push API is two-phase: the ticket says the message was accepted, and
-- a receipt fetched later says whether the device actually got it. The current
-- code only inspects tickets, so it catches DeviceNotRegistered only in the
-- minority of cases where it surfaces immediately -- in the normal case it
-- arrives in the receipt, and those dead tokens are never pruned, so every
-- future fan-out keeps paying to send to phones that uninstalled the app.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `push_receipts` (
  `ticket_id`       varchar(64)  NOT NULL,
  `expo_push_token` varchar(255) NOT NULL,
  `created_at`      timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `checked_at`      timestamp    NULL DEFAULT NULL,
  PRIMARY KEY (`ticket_id`),
  -- The poller's access path: oldest unchecked first. Expo keeps receipts for
  -- about 24 hours, so anything older than that is never going to resolve.
  KEY `idx_unchecked` (`checked_at`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 3. Quiet hours
--
-- Stored per user as local wall-clock times. users.timezone already exists and
-- defaults to UTC, so the comparison is done in the user's own zone rather
-- than the server's -- a 22:00 cutoff means 22:00 where they are.
--
-- NULL means no quiet hours, which stays the default: this is opt-in, because
-- silently withholding notifications someone expects is worse than one arriving
-- late at night.
-- ----------------------------------------------------------------------------
SET @add_qh_start := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'quiet_hours_start') = 0,
  'ALTER TABLE `users` ADD COLUMN `quiet_hours_start` time DEFAULT NULL',
  'SELECT "quiet_hours_start exists" AS skipped'
);
PREPARE s FROM @add_qh_start; EXECUTE s; DEALLOCATE PREPARE s;

SET @add_qh_end := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'quiet_hours_end') = 0,
  'ALTER TABLE `users` ADD COLUMN `quiet_hours_end` time DEFAULT NULL',
  'SELECT "quiet_hours_end exists" AS skipped'
);
PREPARE s FROM @add_qh_end; EXECUTE s; DEALLOCATE PREPARE s;

SELECT 'migration 008 complete' AS `status`;
