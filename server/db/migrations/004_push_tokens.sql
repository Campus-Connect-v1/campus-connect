-- ============================================================================
-- Migration 004 — per-device Expo push tokens
-- ----------------------------------------------------------------------------
-- Idempotent; safe to re-run.
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `user_push_tokens` (
  `token_id`         varchar(50)  NOT NULL,
  `user_id`          varchar(50)  NOT NULL,
  `expo_push_token`  varchar(255) NOT NULL,
  `platform`         enum('ios','android','web','unknown') NOT NULL DEFAULT 'unknown',
  `device_id`        varchar(255) DEFAULT NULL,
  `is_active`        tinyint(1)   NOT NULL DEFAULT '1',
  `created_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `unique_expo_push_token` (`expo_push_token`),
  KEY `idx_user_active` (`user_id`,`is_active`),
  CONSTRAINT `user_push_tokens_ibfk_1` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT 'migration 004 complete' AS `status`;
