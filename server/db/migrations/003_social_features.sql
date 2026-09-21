-- ============================================================================
-- Migration 003 — polls, stories, moderation, notifications
-- ----------------------------------------------------------------------------
-- Idempotent; safe to re-run.
--   mysql -h <host> -u <user> -p <database> < db/migrations/003_social_features.sql
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- media_type gains 'poll'
-- A poll is a post, so it appears in the feed, carries comments and likes, and
-- respects the same visibility rules. Modelling it separately would duplicate
-- all of that.
-- ----------------------------------------------------------------------------
SET @s := IF((SELECT COLUMN_TYPE FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='posts'
                AND COLUMN_NAME='media_type') NOT LIKE '%poll%',
  "ALTER TABLE `posts` MODIFY `media_type` enum('image','video','text','poll') DEFAULT 'text'",
  "DO 0");
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ----------------------------------------------------------------------------
-- 1. Polls
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `polls` (
  `poll_id`         varchar(50)  NOT NULL,
  `post_id`         varchar(50)  NOT NULL,
  `question`        varchar(500) NOT NULL,
  -- 1 = single choice. >1 allows that many selections.
  `max_selections`  int          NOT NULL DEFAULT '1',
  -- NULL = never closes.
  `closes_at`       timestamp    NULL DEFAULT NULL,
  `allow_change`    tinyint(1)   NOT NULL DEFAULT '1',
  `created_at`      timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`poll_id`),
  -- One poll per post.
  UNIQUE KEY `unique_poll_post` (`post_id`),
  CONSTRAINT `polls_ibfk_1` FOREIGN KEY (`post_id`)
    REFERENCES `posts` (`post_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `poll_options` (
  `option_id`    varchar(50)  NOT NULL,
  `poll_id`      varchar(50)  NOT NULL,
  `option_text`  varchar(255) NOT NULL,
  `position`     int          NOT NULL DEFAULT '0',
  PRIMARY KEY (`option_id`),
  -- Stable display order, and prevents two options claiming the same slot.
  UNIQUE KEY `unique_option_position` (`poll_id`,`position`),
  CONSTRAINT `poll_options_ibfk_1` FOREIGN KEY (`poll_id`)
    REFERENCES `polls` (`poll_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `poll_votes` (
  `vote_id`     varchar(50) NOT NULL,
  `poll_id`     varchar(50) NOT NULL,
  `option_id`   varchar(50) NOT NULL,
  `user_id`     varchar(50) NOT NULL,
  `created_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vote_id`),
  -- One vote per option per person. Multi-select polls therefore produce
  -- several rows, and the max_selections cap is enforced in the model.
  UNIQUE KEY `unique_option_vote` (`option_id`,`user_id`),
  KEY `idx_poll_user` (`poll_id`,`user_id`),
  CONSTRAINT `poll_votes_ibfk_1` FOREIGN KEY (`poll_id`)
    REFERENCES `polls` (`poll_id`) ON DELETE CASCADE,
  CONSTRAINT `poll_votes_ibfk_2` FOREIGN KEY (`option_id`)
    REFERENCES `poll_options` (`option_id`) ON DELETE CASCADE,
  CONSTRAINT `poll_votes_ibfk_3` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 2. Stories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stories` (
  `story_id`          varchar(50) NOT NULL,
  `user_id`           varchar(50) NOT NULL,
  `story_type`        enum('image','video','text','repost') NOT NULL DEFAULT 'image',
  -- image/video stories
  `media_url`         varchar(500) DEFAULT NULL,
  -- text stories, or a caption over media
  `content`           text,
  `background_color`  varchar(7)   DEFAULT NULL,
  -- repost stories point at an existing post
  `repost_post_id`    varchar(50)  DEFAULT NULL,
  `visibility`        enum('public','connections','university') DEFAULT 'connections',
  -- Explicit rather than computed, so the expiry window can differ per story
  -- and the index below can drive the "active stories" query directly.
  `expires_at`        timestamp   NOT NULL,
  `is_active`         tinyint(1)  DEFAULT '1',
  `created_at`        timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`story_id`),
  KEY `idx_active_window` (`is_active`,`expires_at`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  CONSTRAINT `stories_ibfk_1` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `stories_ibfk_2` FOREIGN KEY (`repost_post_id`)
    REFERENCES `posts` (`post_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `story_views` (
  `view_id`    varchar(50) NOT NULL,
  `story_id`   varchar(50) NOT NULL,
  `user_id`    varchar(50) NOT NULL,
  `viewed_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`view_id`),
  UNIQUE KEY `unique_story_view` (`story_id`,`user_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `story_views_ibfk_1` FOREIGN KEY (`story_id`)
    REFERENCES `stories` (`story_id`) ON DELETE CASCADE,
  CONSTRAINT `story_views_ibfk_2` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 3. Moderation
-- ----------------------------------------------------------------------------

-- "Not interested / hide this post". Composite primary key rather than a
-- surrogate id: the pair IS the identity, and it makes the feed's NOT EXISTS
-- lookup an index hit.
CREATE TABLE IF NOT EXISTS `hidden_posts` (
  `user_id`     varchar(50) NOT NULL,
  `post_id`     varchar(50) NOT NULL,
  `created_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`post_id`),
  KEY `idx_post` (`post_id`),
  CONSTRAINT `hidden_posts_ibfk_1` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `hidden_posts_ibfk_2` FOREIGN KEY (`post_id`)
    REFERENCES `posts` (`post_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `post_reports` (
  `report_id`    varchar(50) NOT NULL,
  `post_id`      varchar(50) NOT NULL,
  `reporter_id`  varchar(50) NOT NULL,
  `reason`       enum('spam','harassment','hate_speech','misinformation','inappropriate','other') NOT NULL,
  `details`      varchar(500) DEFAULT NULL,
  `status`       enum('pending','reviewed','actioned','dismissed') NOT NULL DEFAULT 'pending',
  -- Operator who handled it. No FK: an operator may be deleted while the
  -- moderation record must survive as an audit trail.
  `reviewed_by`  varchar(50)  DEFAULT NULL,
  `reviewed_at`  timestamp    NULL DEFAULT NULL,
  `created_at`   timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  -- One report per person per post; reporting again updates rather than piles up.
  UNIQUE KEY `unique_reporter_post` (`post_id`,`reporter_id`),
  KEY `idx_status` (`status`,`created_at`),
  CONSTRAINT `post_reports_ibfk_1` FOREIGN KEY (`post_id`)
    REFERENCES `posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `post_reports_ibfk_2` FOREIGN KEY (`reporter_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- "See less of this kind of post". A signal the feed query reads, rather than
-- a hard filter, so it can down-rank instead of removing content entirely.
CREATE TABLE IF NOT EXISTS `feed_preferences` (
  `user_id`       varchar(50) NOT NULL,
  `signal_type`   enum('media_type','author','university','course') NOT NULL,
  `signal_value`  varchar(100) NOT NULL,
  -- Negative = see less, positive = see more. Range is clamped in the model.
  `weight`        int         NOT NULL DEFAULT '-1',
  `created_at`    timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    timestamp   NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`signal_type`,`signal_value`),
  CONSTRAINT `feed_preferences_ibfk_1` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------------------
-- 4. Notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id`  varchar(50) NOT NULL,
  -- Recipient.
  `user_id`          varchar(50) NOT NULL,
  -- Who caused it. NULL for system notices.
  `actor_id`         varchar(50) DEFAULT NULL,
  `type`             enum('connection_request','connection_accepted','post_like',
                          'post_comment','comment_reply','group_invite','group_joined',
                          'event_invite','event_reminder','event_rsvp','story_view',
                          'poll_vote','report_actioned','system') NOT NULL,
  -- What it points at, so the client can deep-link without a type switch.
  `resource_type`    varchar(50)  DEFAULT NULL,
  `resource_id`      varchar(50)  DEFAULT NULL,
  `title`            varchar(255) NOT NULL,
  `body`             varchar(500) DEFAULT NULL,
  `is_read`          tinyint(1)   NOT NULL DEFAULT '0',
  `read_at`          timestamp    NULL DEFAULT NULL,
  `created_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  -- Drives both the unread badge count and the paged list.
  KEY `idx_user_unread` (`user_id`,`is_read`,`created_at`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`actor_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT 'migration 003 complete' AS `status`;
