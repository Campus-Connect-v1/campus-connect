-- ============================================================================
-- Migration 010 — @mentions
-- ----------------------------------------------------------------------------
-- Mentions are stored inline in the content as `@[label](user_id)`; see
-- utils/mentions.js for why. These tables are the INDEX over that text, not
-- the source of truth: they are rewritten from the content on every create and
-- edit, so a mention removed by an edit stops existing here too.
--
-- They exist so "who did this post mention" and "posts that mention me" are
-- index lookups rather than a LIKE scan over every post body.
--
-- Idempotent; safe to re-run.
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `post_mentions` (
  `post_id`     varchar(50) NOT NULL,
  `user_id`     varchar(50) NOT NULL,
  `created_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  -- One row per (post, person): mentioning someone twice in one post is one
  -- mention, and this is what makes re-indexing an edit idempotent.
  PRIMARY KEY (`post_id`, `user_id`),
  -- "Posts that mention me", newest first.
  KEY `idx_post_mentions_user` (`user_id`, `created_at`),
  CONSTRAINT `fk_post_mentions_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_mentions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `comment_mentions` (
  `comment_id`  varchar(50) NOT NULL,
  `user_id`     varchar(50) NOT NULL,
  `created_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`, `user_id`),
  KEY `idx_comment_mentions_user` (`user_id`, `created_at`),
  CONSTRAINT `fk_comment_mentions_comment`
    FOREIGN KEY (`comment_id`) REFERENCES `post_comments` (`comment_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_mentions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Adds 'mention'. Every existing value is repeated verbatim, including
-- 'new_follower', which reached production outside any tracked migration:
-- MODIFY replaces the whole enum, and a value dropped here would silently
-- truncate every existing row of that type to '' rather than erroring. This
-- list is 006's plus 'mention' and nothing else.
ALTER TABLE `notifications`
  MODIFY COLUMN `type` enum(
    'connection_request','connection_accepted','post_like',
    'post_comment','comment_reply','group_invite','group_joined',
    'event_invite','event_reminder','event_rsvp','story_view',
    'poll_vote','report_actioned','new_follower','system',
    'new_post','event_created','mention'
  ) NOT NULL;

SELECT 'migration 010 complete' AS `status`,
       (SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'notifications'
           AND COLUMN_NAME = 'type') AS `notification_enum`;
