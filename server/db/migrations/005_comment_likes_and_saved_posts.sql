-- ============================================================================
-- Migration 005 — comment likes and server-side saved posts
-- ----------------------------------------------------------------------------
--   mysql -h <host> -u <user> -p <database> < db/migrations/005_comment_likes_and_saved_posts.sql
--
-- Idempotent; safe to re-run.
--
-- Both tables mirror post_likes: a surrogate varchar id to match the app's
-- `<prefix>_<uuid>` convention, a UNIQUE pair so a double tap cannot insert
-- twice, and ON DELETE CASCADE so removing a post or a user takes its rows
-- with it rather than leaving orphans the feed would have to filter.
-- ============================================================================

SET NAMES utf8mb4;

-- Likes on a comment. Deliberately separate from post_likes rather than a
-- nullable post_id/comment_id pair on one table: a single table could not
-- express "exactly one of the two is set" without a CHECK, and every read
-- would need the discriminator in its WHERE clause.
CREATE TABLE IF NOT EXISTS `comment_likes` (
  `like_id`     varchar(50) NOT NULL,
  `comment_id`  varchar(50) NOT NULL,
  `user_id`     varchar(50) NOT NULL,
  `created_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `unique_comment_like` (`comment_id`,`user_id`),
  KEY `idx_comment_like_user` (`user_id`),
  CONSTRAINT `comment_likes_ibfk_1` FOREIGN KEY (`comment_id`)
    REFERENCES `post_comments` (`comment_id`) ON DELETE CASCADE,
  CONSTRAINT `comment_likes_ibfk_2` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Bookmarks. Until now these lived only in AsyncStorage on the device, so they
-- were lost on reinstall and never appeared on a second device.
CREATE TABLE IF NOT EXISTS `saved_posts` (
  `saved_id`    varchar(50) NOT NULL,
  `post_id`     varchar(50) NOT NULL,
  `user_id`     varchar(50) NOT NULL,
  `created_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`saved_id`),
  UNIQUE KEY `unique_saved_post` (`post_id`,`user_id`),
  -- Ordered index: the saved list is always "this user's, newest first".
  KEY `idx_saved_user_created` (`user_id`,`created_at`),
  CONSTRAINT `saved_posts_ibfk_1` FOREIGN KEY (`post_id`)
    REFERENCES `posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `saved_posts_ibfk_2` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT 'migration 005 complete' AS `status`;
