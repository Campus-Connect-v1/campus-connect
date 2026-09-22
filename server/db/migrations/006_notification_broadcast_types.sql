-- ============================================================================
-- Migration 006 — broadcast notification types
-- ----------------------------------------------------------------------------
-- Adds 'new_post' (fan-out to the author's accepted connections when they
-- post) and 'event_created' (fan-out to a university when a public event is
-- created). Widening an ENUM is additive and backward compatible.
--
-- Built from the enum as it actually stands on the live DB (SHOW COLUMNS),
-- not from an older migration file -- it already carries 'new_follower',
-- which isn't referenced anywhere in this repo, so it was added directly to
-- prod outside of any tracked migration. This ALTER must keep it, or MySQL
-- would silently truncate any existing/future 'new_follower' row's type to
-- '' instead of erroring (same footgun this migration exists to close).
--
-- Idempotent; safe to re-run.
-- ============================================================================

SET NAMES utf8mb4;

ALTER TABLE `notifications`
  MODIFY COLUMN `type` enum(
    'connection_request','connection_accepted','post_like',
    'post_comment','comment_reply','group_invite','group_joined',
    'event_invite','event_reminder','event_rsvp','story_view',
    'poll_vote','report_actioned','new_follower','system',
    'new_post','event_created'
  ) NOT NULL; -- verified against live SHOW COLUMNS before writing this file

SELECT 'migration 006 complete' AS `status`;
