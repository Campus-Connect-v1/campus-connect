-- ============================================================================
-- Migration 006 — the follow graph
-- ----------------------------------------------------------------------------
--   mysql -h <host> -u <user> -p <database> < db/migrations/006_follows.sql
--
-- Idempotent; safe to re-run.
--
-- `connections` is a symmetric friend request: one directed row per pair, with
-- a status, and both people have to agree. That models a friendship, and it is
-- the right primitive for "we know each other" — but it cannot model reach.
-- Nothing can travel further than a mutual acceptance, so there is no way for
-- a society, a lecturer or a student journalist to be read by people who have
-- not individually agreed to know them.
--
-- `follows` is the asymmetric half: one row, one direction, no approval. The
-- two coexist rather than one replacing the other — connections keep gating
-- 'connections'-visibility posts and messaging, while follows decide whose
-- public posts reach your timeline.
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `follows` (
  `follow_id`    varchar(50) NOT NULL,
  `follower_id`  varchar(50) NOT NULL,
  `following_id` varchar(50) NOT NULL,
  `created_at`   timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follow_id`),
  -- One row per direction per pair. A double tap on Follow is a no-op rather
  -- than a second row inflating the count.
  UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  -- "Whose posts should I see", newest first — the feed's access path.
  KEY `idx_follower_created` (`follower_id`,`created_at`),
  -- "Who follows this person" — the profile counter and the follower list.
  KEY `idx_following` (`following_id`),
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`following_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Being followed is a notification-worthy event and the enum is a closed set,
-- so it has to be widened before notify() can write the row. Re-running this
-- statement sets the same definition, which is why it is safe without a guard.
ALTER TABLE `notifications`
  MODIFY COLUMN `type` enum(
    'connection_request','connection_accepted','post_like','post_comment',
    'comment_reply','group_invite','group_joined','event_invite',
    'event_reminder','event_rsvp','story_view','poll_vote','report_actioned',
    'new_follower','system'
  ) NOT NULL;

-- ----------------------------------------------------------------------------
-- Backfill: every accepted connection becomes a mutual follow.
--
-- Without this, switching the feed to read from `follows` would empty it for
-- all 233 existing accounts on the first deploy — everyone would have a graph
-- of zero. Two rows per connection, one per direction, because a friendship
-- implies each party wants to read the other.
--
-- INSERT IGNORE leans on unique_follow, so re-running adds nothing.
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO `follows` (follow_id, follower_id, following_id, created_at)
SELECT CONCAT('follow_', UUID()), c.requester_id, c.receiver_id, c.created_at
FROM `connections` c
JOIN `users` a ON a.user_id = c.requester_id AND a.is_active = 1
JOIN `users` b ON b.user_id = c.receiver_id  AND b.is_active = 1
WHERE c.status = 'accepted';

INSERT IGNORE INTO `follows` (follow_id, follower_id, following_id, created_at)
SELECT CONCAT('follow_', UUID()), c.receiver_id, c.requester_id, c.created_at
FROM `connections` c
JOIN `users` a ON a.user_id = c.requester_id AND a.is_active = 1
JOIN `users` b ON b.user_id = c.receiver_id  AND b.is_active = 1
WHERE c.status = 'accepted';

SELECT 'migration 006 complete' AS `status`, (SELECT COUNT(*) FROM follows) AS `follow_rows`;
