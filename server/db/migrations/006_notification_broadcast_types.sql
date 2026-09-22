-- ============================================================================
-- Migration 006 — broadcast notification types
-- ----------------------------------------------------------------------------
-- Adds 'new_post' (fan-out to the author's accepted connections when they
-- post) and 'event_created' (fan-out to a university when a public event is
-- created). Widening an ENUM is additive and backward compatible.
--
-- Idempotent; safe to re-run.
-- ============================================================================

SET NAMES utf8mb4;

ALTER TABLE `notifications`
  MODIFY COLUMN `type` enum(
    'connection_request','connection_accepted','post_like',
    'post_comment','comment_reply','group_invite','group_joined',
    'event_invite','event_reminder','event_rsvp','story_view',
    'poll_vote','report_actioned','system',
    'new_post','event_created'
  ) NOT NULL;

SELECT 'migration 006 complete' AS `status`;
