-- ============================================================================
-- Migration 012 — password reset codes
-- ----------------------------------------------------------------------------
-- The reset flow sent a signed JWT in a link, while the app asked the user to
-- "paste the code from your email". A JWT is ~200 characters; nobody pastes
-- that out of an email, and it is not a code. This is the storage a SHORT code
-- needs, because a six digit code cannot carry its own claims the way a token
-- can -- the server has to remember it.
--
-- One row per user: requesting a new code replaces the old one, so an email
-- someone forwarded or a code read over their shoulder stops working the
-- moment a fresh one is asked for.
--
-- `attempts` is not bookkeeping. Six digits is a million guesses, which is
-- nothing to a script, so the count is what actually protects the account;
-- the hash only protects it if the database leaks.
--
-- Collation matches the live schema (utf8mb4_0900_ai_ci), not the utf8mb4_
-- unicode_ci this repo's older migrations declared. A foreign key between
-- columns of differing collations fails outright in MySQL.
--
-- Idempotent; safe to re-run.
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `password_reset_codes` (
  `user_id`     varchar(50) NOT NULL,
  -- bcrypt, not a fast digest: six digits is a small enough space that a
  -- leaked sha256 column would be reversed in seconds.
  `code_hash`   varchar(255) NOT NULL,
  `expires_at`  timestamp   NOT NULL,
  `attempts`    tinyint     NOT NULL DEFAULT 0,
  `created_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  -- For sweeping expired rows.
  KEY `idx_password_reset_expires` (`expires_at`),
  CONSTRAINT `fk_password_reset_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT 'migration 012 complete' AS `status`;
