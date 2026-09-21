-- ============================================================================
-- Migration 002 — operator accounts for the admin web app in app/
-- ----------------------------------------------------------------------------
-- Adds the `operators` table. Idempotent; safe to re-run.
--
--   mysql -h <host> -u <user> -p <database> < db/migrations/002_operators.sql
--
-- Creates no accounts. Bootstrap the first owner afterwards with:
--   cd server && node scripts/createOperator.js
-- ============================================================================

CREATE TABLE IF NOT EXISTS `operators` (
  `operator_id`    varchar(50)  NOT NULL,
  `email`          varchar(255) NOT NULL,
  `password_hash`  varchar(255) NOT NULL,
  `first_name`     varchar(100) NOT NULL,
  `last_name`      varchar(100) NOT NULL,
  `role`           enum('owner','admin','support') NOT NULL DEFAULT 'support',
  `is_active`      tinyint(1)   DEFAULT '1',
  `last_login`     timestamp    NULL DEFAULT NULL,
  `created_at`     timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`operator_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT 'migration 002 complete' AS `status`;
