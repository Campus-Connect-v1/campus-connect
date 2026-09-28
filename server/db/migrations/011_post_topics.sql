-- ============================================================================
-- Migration 011 — post topics
-- ----------------------------------------------------------------------------
-- The home screen has always had a category rail (Trending, Events, Sports,
-- Academic, Music, Food). It set a state variable that nothing read: five of
-- the six chips did nothing at all. Posts had no field to filter on, so there
-- was nothing they COULD do.
--
-- Nullable, and left null on every existing post. A post written before this
-- has no topic and no honest way to guess one -- inferring from the text would
-- file people's posts under categories they did not choose. Untagged posts
-- still appear in the main feed; they simply do not appear under a chip.
--
-- varchar rather than enum: adding a category should be a deploy, not an
-- ALTER on a table that is only going to get bigger. The allowed values live
-- in utils/postTopics.js, which is what validates writes.
--
-- Idempotent; safe to re-run.
-- ============================================================================

SET NAMES utf8mb4;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'posts'
     AND COLUMN_NAME = 'topic'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE `posts` ADD COLUMN `topic` varchar(24) DEFAULT NULL AFTER `media_type`',
  'SELECT "posts.topic already present" AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'posts'
     AND INDEX_NAME = 'idx_posts_topic'
);

-- (topic, created_at): the filter is always "this topic, newest first", so a
-- topic-only index would still leave the sort to a filesort.
SET @sql := IF(
  @index_exists = 0,
  'ALTER TABLE `posts` ADD INDEX `idx_posts_topic` (`topic`, `created_at`)',
  'SELECT "idx_posts_topic already present" AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'migration 011 complete' AS `status`,
       (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'topic') AS `has_topic_column`;
