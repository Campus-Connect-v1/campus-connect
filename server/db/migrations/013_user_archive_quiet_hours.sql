-- ============================================================================
-- Migration 013 — bring user_archive back in line with users
-- ----------------------------------------------------------------------------
-- Migration 008 added quiet_hours_start and quiet_hours_end to `users` but not
-- to `user_archive`. deleteProfileModel archived with INSERT ... SELECT *, so
-- from then on the column counts differed and every account deletion failed.
--
-- deleteProfileModel now archives only the columns both tables share, so
-- deletion works with or without this migration. Running it means quiet-hours
-- settings are archived too, and a recovered account gets them back with
-- everything else.
--
-- The columns go after updated_at, the same position they hold in `users`, so
-- the two tables line up again column for column ahead of archived_at.
--
-- Idempotent: each ALTER runs only if the column is missing.
-- ----------------------------------------------------------------------------
SET @add_archive_qh_start := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_archive'
      AND COLUMN_NAME = 'quiet_hours_start') = 0,
  'ALTER TABLE `user_archive` ADD COLUMN `quiet_hours_start` time DEFAULT NULL AFTER `updated_at`',
  'SELECT "user_archive.quiet_hours_start exists" AS skipped'
);
PREPARE s FROM @add_archive_qh_start; EXECUTE s; DEALLOCATE PREPARE s;

SET @add_archive_qh_end := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_archive'
      AND COLUMN_NAME = 'quiet_hours_end') = 0,
  'ALTER TABLE `user_archive` ADD COLUMN `quiet_hours_end` time DEFAULT NULL AFTER `quiet_hours_start`',
  'SELECT "user_archive.quiet_hours_end exists" AS skipped'
);
PREPARE s FROM @add_archive_qh_end; EXECUTE s; DEALLOCATE PREPARE s;

SELECT 'migration 013 complete' AS `status`;
