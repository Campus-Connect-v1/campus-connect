-- ============================================================================
-- Campus Connect — production database initialisation
-- ----------------------------------------------------------------------------
-- Schema only. No seed data. Safe to re-run (IF NOT EXISTS throughout).
-- Derived from campus_connect.sql (phpMyAdmin dump, 2025-10-22).
--
-- Requires MySQL 8.0+ (utf8mb4_0900_ai_ci collation, functional JSON type).
-- On MariaDB or MySQL 5.7, replace utf8mb4_0900_ai_ci with utf8mb4_unicode_ci
-- throughout.
--
--   mysql -h <host> -u <admin> -p < db/init.sql
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `campus_connect`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `campus_connect`;


-- ============================================================================
-- 1. Tenancy / campus reference data
-- ============================================================================

CREATE TABLE IF NOT EXISTS `universities` (
  `university_id`    varchar(50)  NOT NULL,
  `name`             varchar(255) NOT NULL,
  `domain`           varchar(100) NOT NULL,
  `address`          text,
  `city`             varchar(100) DEFAULT NULL,
  `state`            varchar(100) DEFAULT NULL,
  `country`          varchar(100) DEFAULT NULL,
  `logo_url`         varchar(500) DEFAULT NULL,
  `is_verified`      tinyint(1)   DEFAULT '0',
  `primary_color`    varchar(7)   DEFAULT '#000000',
  `secondary_color`  varchar(7)   DEFAULT '#FFFFFF',
  `accent_color`     varchar(7)   DEFAULT '#666666',
  `text_color`       varchar(7)   DEFAULT '#333333',
  `created_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`university_id`),
  UNIQUE KEY `domain` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `university_departments` (
  `department_id`    varchar(50)  NOT NULL,
  `university_id`    varchar(50)  NOT NULL,
  `department_code`  varchar(20)  NOT NULL,
  `department_name`  varchar(255) NOT NULL,
  `description`      text,
  `created_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `unique_department_code` (`university_id`,`department_code`),
  KEY `idx_university_id` (`university_id`),
  CONSTRAINT `university_departments_ibfk_1`
    FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `campus_buildings` (
  `building_id`    varchar(50)  NOT NULL,
  `university_id`  varchar(50)  NOT NULL,
  `building_code`  varchar(20)  NOT NULL,
  `building_name`  varchar(255) NOT NULL,
  `address`        text,
  `latitude`       decimal(10,8) DEFAULT NULL,
  `longitude`      decimal(11,8) DEFAULT NULL,
  `description`    text,
  `building_type`  enum('academic','administrative','residential','recreational','dining','library','sports') DEFAULT 'academic',
  `floors`         int          DEFAULT '1',
  `is_accessible`  tinyint(1)   DEFAULT '1',
  `created_at`     timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`building_id`),
  UNIQUE KEY `unique_building_code` (`university_id`,`building_code`),
  KEY `idx_university_id` (`university_id`),
  KEY `idx_building_type` (`building_type`),
  CONSTRAINT `campus_buildings_ibfk_1`
    FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `campus_facilities` (
  `facility_id`      varchar(50)  NOT NULL,
  `building_id`      varchar(50)  NOT NULL,
  `facility_name`    varchar(255) NOT NULL,
  `floor`            int          DEFAULT '1',
  `room_number`      varchar(20)  DEFAULT NULL,
  `capacity`         int          DEFAULT NULL,
  `facility_type`    enum('classroom','lab','study_room','office','cafe','lounge','library','gym','other') DEFAULT 'other',
  `description`      text,
  `operating_hours`  text,
  `is_reservable`    tinyint(1)   DEFAULT '0',
  `created_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`facility_id`),
  KEY `idx_building_id` (`building_id`),
  KEY `idx_facility_type` (`facility_type`),
  CONSTRAINT `campus_facilities_ibfk_1`
    FOREIGN KEY (`building_id`) REFERENCES `campus_buildings` (`building_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================================
-- 2. Identity
-- ============================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `user_id`                   varchar(50)  NOT NULL,
  `university_id`             varchar(50)  NOT NULL,
  `email`                     varchar(255) NOT NULL,
  -- NULL for OAuth users, who never set one. createUser() in
  -- models/auth.model.js omits it entirely on the Google path.
  `password_hash`             varchar(255) DEFAULT NULL,
  `first_name`                varchar(100) NOT NULL,
  `last_name`                 varchar(100) NOT NULL,
  `gender`                    enum('M','F','unknown','not specified') NOT NULL,
  `auth_provider`             enum('email','google') NOT NULL DEFAULT 'email',
  `provider_id`               varchar(255) DEFAULT NULL,
  `is_edu_verified`           tinyint(1)   DEFAULT '0',
  `profile_picture_url`       varchar(500) DEFAULT NULL,
  `phone_number`              varchar(20)  DEFAULT NULL,
  `program`                   varchar(100) DEFAULT NULL,
  `graduation_year`           int          DEFAULT NULL,
  `year_of_study`             enum('1','2','3','4','5+','graduate') DEFAULT NULL,
  `bio`                       text,
  `profile_headline`          varchar(255) DEFAULT NULL,
  `linkedin_url`              varchar(500) DEFAULT NULL,
  `website_url`               varchar(500) DEFAULT NULL,
  `date_of_birth`             date         DEFAULT NULL,
  `timezone`                  varchar(50)  DEFAULT 'UTC',
  `show_location_preference`  enum('friends','university','none') DEFAULT 'friends',
  `show_status_preference`    enum('friends','university','none') DEFAULT 'friends',
  `privacy_profile`           enum('public','university','friends','private') DEFAULT 'friends',
  `notification_email`        tinyint(1)   DEFAULT '1',
  `notification_push`         tinyint(1)   DEFAULT '1',
  `interests`                 text,
  `social_links`              text,
  `privacy_settings`          text,
  `is_active`                 tinyint(1)   DEFAULT '1',
  `is_email_verified`         tinyint(1)   DEFAULT '0',
  `is_profile_complete`       tinyint(1)   DEFAULT '0',
  `last_login`                timestamp    NULL DEFAULT NULL,
  `created_at`                timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_university_id` (`university_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_auth_provider` (`auth_provider`,`provider_id`),
  CONSTRAINT `users_ibfk_1`
    FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Note: the dump also carried a redundant `idx_email` KEY on (email); the
-- UNIQUE KEY above already serves those lookups, so it is omitted.


-- Soft-delete landing table. Deliberately has NO foreign key to `users`:
-- rows must survive the delete that puts them here.
CREATE TABLE IF NOT EXISTS `user_archive` (
  `user_id`                   varchar(50)  NOT NULL,
  `university_id`             varchar(50)  NOT NULL,
  `email`                     varchar(255) NOT NULL,
  -- NULL for OAuth users, who never set one. createUser() in
  -- models/auth.model.js omits it entirely on the Google path.
  `password_hash`             varchar(255) DEFAULT NULL,
  `first_name`                varchar(100) NOT NULL,
  `last_name`                 varchar(100) NOT NULL,
  `gender`                    enum('M','F','unknown','not specified') NOT NULL,
  `auth_provider`             enum('email','google') NOT NULL DEFAULT 'email',
  `provider_id`               varchar(255) DEFAULT NULL,
  `is_edu_verified`           tinyint(1)   DEFAULT '0',
  `profile_picture_url`       varchar(500) DEFAULT NULL,
  `phone_number`              varchar(20)  DEFAULT NULL,
  `program`                   varchar(100) DEFAULT NULL,
  `graduation_year`           int          DEFAULT NULL,
  `year_of_study`             enum('1','2','3','4','5+','graduate') DEFAULT NULL,
  `bio`                       text,
  `profile_headline`          varchar(255) DEFAULT NULL,
  `linkedin_url`              varchar(500) DEFAULT NULL,
  `website_url`               varchar(500) DEFAULT NULL,
  `date_of_birth`             date         DEFAULT NULL,
  `timezone`                  varchar(50)  DEFAULT 'UTC',
  `show_location_preference`  enum('friends','university','none') DEFAULT 'friends',
  `show_status_preference`    enum('friends','university','none') DEFAULT 'friends',
  `privacy_profile`           enum('public','university','friends','private') DEFAULT 'friends',
  `notification_email`        tinyint(1)   DEFAULT '1',
  `notification_push`         tinyint(1)   DEFAULT '1',
  `interests`                 text,
  `social_links`              text,
  `privacy_settings`          text,
  `is_active`                 tinyint(1)   DEFAULT '1',
  `is_email_verified`         tinyint(1)   DEFAULT '0',
  `is_profile_complete`       tinyint(1)   DEFAULT '0',
  `last_login`                timestamp    NULL DEFAULT NULL,
  `created_at`                timestamp    NULL DEFAULT NULL,
  `updated_at`                timestamp    NULL DEFAULT NULL,
  `archived_at`               timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `deletion_reason`           varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `user_sessions` (
  `session_id`    varchar(100) NOT NULL,
  `user_id`       varchar(50)  NOT NULL,
  `device_type`   enum('ios','android','web') DEFAULT 'ios',
  `device_token`  varchar(255) DEFAULT NULL,
  `fcm_token`     varchar(255) DEFAULT NULL,
  `ip_address`    varchar(45)  DEFAULT NULL,
  `last_active`   timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`    timestamp    NOT NULL,
  `is_active`     tinyint(1)   DEFAULT '1',
  `created_at`    timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `user_sessions_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- `otp_code` holds a bcrypt hash, never the code itself. A 6-digit code has
-- only 10^6 possibilities, so a fast hash would be trivially reversible from a
-- database leak while the code is still live; bcrypt's work factor is the point.
-- `attempts` caps online guessing, which hashing does nothing to prevent --
-- /auth/verify-otp is otherwise limited only per-IP.
CREATE TABLE IF NOT EXISTS `otps` (
  `id`          int          NOT NULL AUTO_INCREMENT,
  `email`       varchar(255) NOT NULL,
  `otp_code`    varchar(255) NOT NULL,
  `attempts`    int          NOT NULL DEFAULT '0',
  `expires_at`  timestamp    NOT NULL,
  `created_at`  timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================================
-- 3. Profile detail
-- ============================================================================

CREATE TABLE IF NOT EXISTS `user_courses` (
  `user_course_id`  int          NOT NULL AUTO_INCREMENT,
  `user_id`         varchar(50)  NOT NULL,
  `course_code`     varchar(50)  NOT NULL,
  `course_name`     varchar(255) NOT NULL,
  `department_id`   varchar(50)  DEFAULT NULL,
  `semester`        varchar(50)  DEFAULT NULL,
  `academic_year`   int          DEFAULT NULL,
  `is_current`      tinyint(1)   DEFAULT '1',
  `created_at`      timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_course_id`),
  UNIQUE KEY `unique_user_course` (`user_id`,`course_code`,`academic_year`),
  KEY `idx_course_code` (`course_code`),
  KEY `idx_department_id` (`department_id`),
  CONSTRAINT `user_courses_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE,
  CONSTRAINT `user_courses_ibfk_2`
    FOREIGN KEY (`department_id`) REFERENCES `university_departments` (`department_id`)
    ON DELETE SET NULL ON UPDATE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Note: `idx_user_id` from the dump is dropped — the UNIQUE KEY above is
-- left-prefixed on user_id and already covers it.


CREATE TABLE IF NOT EXISTS `user_interests` (
  `interest_id`    varchar(50)  NOT NULL,
  `user_id`        varchar(50)  NOT NULL,
  `interest_type`  enum('academic','hobby','career','sports','arts') DEFAULT 'hobby',
  `interest_name`  varchar(100) NOT NULL,
  `skill_level`    enum('beginner','intermediate','advanced','expert') DEFAULT 'beginner',
  `created_at`     timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`interest_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_interest_type` (`interest_type`),
  CONSTRAINT `user_interests_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `user_availability` (
  `availability_id`     varchar(50) NOT NULL,
  `user_id`             varchar(50) NOT NULL,
  `day_of_week`         enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `start_time`          time        NOT NULL,
  `end_time`            time        NOT NULL,
  `preferred_activity`  enum('studying','social','sports','meetings') DEFAULT 'studying',
  `is_recurring`        tinyint(1)  DEFAULT '1',
  `created_at`          timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`availability_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_day_time` (`day_of_week`,`start_time`),
  CONSTRAINT `user_availability_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `user_privacy_settings` (
  `user_id`              varchar(50) NOT NULL,
  `profile_visibility`   enum('public','geofenced','private','friends_only') DEFAULT 'geofenced',
  `custom_radius`        int         DEFAULT '100',
  `show_exact_location`  tinyint(1)  DEFAULT '0',
  `visible_fields`       json        DEFAULT NULL,
  `created_at`           timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           timestamp   NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_privacy_settings_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `user_search_index` (
  `user_id`         varchar(50) NOT NULL,
  `search_content`  text        NOT NULL,
  `updated_at`      timestamp   NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  FULLTEXT KEY `idx_search_content` (`search_content`),
  CONSTRAINT `user_search_index_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================================
-- 4. Social graph
-- ============================================================================

CREATE TABLE IF NOT EXISTS `connections` (
  `connection_id`    varchar(50)  NOT NULL,
  `requester_id`     varchar(50)  NOT NULL,
  `receiver_id`      varchar(50)  NOT NULL,
  `status`           enum('pending','accepted','blocked','declined') DEFAULT 'pending',
  `connection_note`  varchar(255) DEFAULT NULL,
  `shared_courses`   text,
  `created_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`connection_id`),
  UNIQUE KEY `unique_connection` (`requester_id`,`receiver_id`),
  KEY `idx_requester_status` (`requester_id`,`status`),
  KEY `idx_receiver_status` (`receiver_id`,`status`),
  CONSTRAINT `connections_ibfk_1`
    FOREIGN KEY (`requester_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE,
  CONSTRAINT `connections_ibfk_2`
    FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================================
-- 5. Study groups
-- ============================================================================

CREATE TABLE IF NOT EXISTS `study_groups` (
  `group_id`                 varchar(50)  NOT NULL,
  `university_id`            varchar(50)  NOT NULL,
  `group_name`               varchar(255) NOT NULL,
  `description`              text,
  `course_code`              varchar(50)  DEFAULT NULL,
  `course_name`              varchar(255) DEFAULT NULL,
  `group_type`               enum('public','private','invite_only') DEFAULT 'public',
  `max_members`              int          DEFAULT '20',
  `meeting_frequency`        enum('weekly','biweekly','monthly','custom') DEFAULT 'weekly',
  `preferred_location_type`  enum('virtual','campus','hybrid') DEFAULT 'campus',
  `created_by`               varchar(50)  NOT NULL,
  `is_active`                tinyint(1)   DEFAULT '1',
  `created_at`               timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`),
  KEY `idx_university_course` (`university_id`,`course_code`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `study_groups_ibfk_1`
    FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`)
    ON DELETE CASCADE,
  CONSTRAINT `study_groups_ibfk_2`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `group_members` (
  `group_member_id`           varchar(50) NOT NULL,
  `group_id`                  varchar(50) NOT NULL,
  `user_id`                   varchar(50) NOT NULL,
  `role`                      enum('creator','admin','member') DEFAULT 'member',
  `notification_preferences`  enum('all','important','none') DEFAULT 'all',
  `joined_at`                 timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  `last_active`               timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_member_id`),
  UNIQUE KEY `unique_group_member` (`group_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `group_members_ibfk_1`
    FOREIGN KEY (`group_id`) REFERENCES `study_groups` (`group_id`)
    ON DELETE CASCADE,
  CONSTRAINT `group_members_ibfk_2`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Note: `idx_group_id` from the dump is dropped — the UNIQUE KEY above is
-- left-prefixed on group_id and already covers it.


-- ============================================================================
-- 6. Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS `events` (
  `event_id`            varchar(50)  NOT NULL,
  `university_id`       varchar(50)  NOT NULL,
  `created_by`          varchar(50)  NOT NULL,
  `event_title`         varchar(255) NOT NULL,
  `event_description`   text,
  `event_type`          enum('academic','social','sports','career','club','workshop') DEFAULT 'social',
  `start_time`          timestamp    NOT NULL,
  `end_time`            timestamp    NOT NULL,
  `is_recurring`        tinyint(1)   DEFAULT '0',
  `recurrence_pattern`  varchar(100) DEFAULT NULL,
  `location_type`       enum('physical','virtual','hybrid') DEFAULT 'physical',
  `physical_location`   varchar(500) DEFAULT NULL,
  `virtual_link`        varchar(500) DEFAULT NULL,
  `max_attendees`       int          DEFAULT NULL,
  `is_public`           tinyint(1)   DEFAULT '1',
  `requires_rsvp`       tinyint(1)   DEFAULT '0',
  `created_at`          timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `idx_university_time` (`university_id`,`start_time`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `events_ibfk_1`
    FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`)
    ON DELETE CASCADE,
  CONSTRAINT `events_ibfk_2`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `event_attendees` (
  `attendee_id`    varchar(50) NOT NULL,
  `event_id`       varchar(50) NOT NULL,
  `user_id`        varchar(50) NOT NULL,
  `rsvp_status`    enum('going','interested','not_going') DEFAULT 'interested',
  `check_in_time`  timestamp   NULL DEFAULT NULL,
  `created_at`     timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp   NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendee_id`),
  UNIQUE KEY `unique_event_attendee` (`event_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_event_status` (`event_id`,`rsvp_status`),
  CONSTRAINT `event_attendees_ibfk_1`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`)
    ON DELETE CASCADE,
  CONSTRAINT `event_attendees_ibfk_2`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================================
-- 7. Feed
-- ============================================================================

CREATE TABLE IF NOT EXISTS `posts` (
  `post_id`     varchar(50)  NOT NULL,
  `user_id`     varchar(50)  NOT NULL,
  `content`     text,
  `media_url`   varchar(500) DEFAULT NULL,
  `media_type`  enum('image','video','text') DEFAULT 'text',
  `visibility`  enum('public','connections','private') DEFAULT 'connections',
  `is_active`   tinyint(1)   DEFAULT '1',
  `expires_at`  timestamp    NULL DEFAULT NULL,
  `created_at`  timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_visibility` (`visibility`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `posts_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `post_comments` (
  `comment_id`         varchar(50) NOT NULL,
  `post_id`            varchar(50) NOT NULL,
  `user_id`            varchar(50) NOT NULL,
  `parent_comment_id`  varchar(50) DEFAULT NULL,
  `content`            text        NOT NULL,
  `is_active`          tinyint(1)  DEFAULT '1',
  `created_at`         timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         timestamp   NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_comment_id`),
  CONSTRAINT `post_comments_ibfk_1`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`)
    ON DELETE CASCADE,
  CONSTRAINT `post_comments_ibfk_2`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE,
  CONSTRAINT `post_comments_ibfk_3`
    FOREIGN KEY (`parent_comment_id`) REFERENCES `post_comments` (`comment_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS `post_likes` (
  `like_id`     varchar(50) NOT NULL,
  `post_id`     varchar(50) NOT NULL,
  `user_id`     varchar(50) NOT NULL,
  `created_at`  timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `unique_post_like` (`post_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `post_likes_ibfk_1`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`)
    ON DELETE CASCADE,
  CONSTRAINT `post_likes_ibfk_2`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Note: `idx_post_id` from the dump is dropped — the UNIQUE KEY above is
-- left-prefixed on post_id and already covers it.


-- ============================================================================
-- 8. Audit
-- ============================================================================

-- No FK on user_id: audit rows must outlive the user they describe.
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `log_id`         bigint       NOT NULL AUTO_INCREMENT,
  `user_id`        varchar(50)  DEFAULT NULL,
  `action_type`    varchar(100) NOT NULL,
  `resource_type`  varchar(100) NOT NULL,
  `resource_id`    varchar(50)  DEFAULT NULL,
  `description`    text,
  `ip_address`     varchar(45)  DEFAULT NULL,
  `user_agent`     text,
  `latitude`       decimal(10,8) DEFAULT NULL,
  `longitude`      decimal(11,8) DEFAULT NULL,
  `created_at`     timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_user_action` (`user_id`,`action_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_action_type` (`action_type`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================================
-- 9. Views
-- ----------------------------------------------------------------------------
-- DEFINER=`root`@`localhost` from the dump is removed — that account will not
-- exist on prod and would make these fail to create. SQL SECURITY INVOKER
-- means the view runs with the app user's own privileges.
-- ============================================================================

CREATE OR REPLACE SQL SECURITY INVOKER VIEW `user_profiles_comprehensive` AS
SELECT
  `u`.`user_id`                   AS `user_id`,
  `u`.`university_id`             AS `university_id`,
  `uni`.`name`                    AS `university_name`,
  `u`.`email`                     AS `email`,
  `u`.`first_name`                AS `first_name`,
  `u`.`last_name`                 AS `last_name`,
  `u`.`profile_picture_url`       AS `profile_picture_url`,
  `u`.`profile_headline`          AS `profile_headline`,
  `u`.`program`                   AS `program`,
  `u`.`graduation_year`           AS `graduation_year`,
  `u`.`bio`                       AS `bio`,
  `u`.`linkedin_url`              AS `linkedin_url`,
  `u`.`website_url`               AS `website_url`,
  `u`.`date_of_birth`             AS `date_of_birth`,
  `u`.`show_location_preference`  AS `show_location_preference`,
  `u`.`show_status_preference`    AS `show_status_preference`,
  `u`.`privacy_profile`           AS `privacy_profile`,
  COUNT(DISTINCT `conn`.`connection_id`) AS `connection_count`,
  COUNT(DISTINCT `gm`.`group_id`)        AS `group_count`,
  COUNT(DISTINCT `ea`.`event_id`)        AS `event_count`,
  `u`.`created_at`                AS `created_at`,
  `u`.`last_login`                AS `last_login`
FROM `users` `u`
  LEFT JOIN `universities` `uni`
    ON `u`.`university_id` = `uni`.`university_id`
  LEFT JOIN `connections` `conn`
    ON (`u`.`user_id` = `conn`.`requester_id` OR `u`.`user_id` = `conn`.`receiver_id`)
   AND `conn`.`status` = 'accepted'
  LEFT JOIN `group_members` `gm`
    ON `u`.`user_id` = `gm`.`user_id`
  LEFT JOIN `event_attendees` `ea`
    ON `u`.`user_id` = `ea`.`user_id`
   AND `ea`.`rsvp_status` = 'going'
WHERE `u`.`is_active` = 1
GROUP BY `u`.`user_id`;


-- `connection_recommendations` is deliberately NOT created here.
--
-- It was dropped from the production schema for two reasons:
--
--   1. Its mutual-friend subquery required `c1.requester_id = u1.user_id` in
--      both OR branches, so a mutual friend only counted when the source user
--      had SENT the request. `connections` holds one directed row per pair, so
--      roughly half of each user's friendships were never counted.
--   2. Subqueries in its select list force MySQL onto the TEMPTABLE algorithm,
--      so the scored candidate set is materialised on every call.
--
-- getConnectionRecommendationsModel() in models/user.model.js now queries the
-- base tables directly and no longer references this view. Nothing else in
-- server/ reads it. If you need it back for ad-hoc analytics, take the
-- definition from campus_connect.sql -- but fix the mutual-friend branch first.


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Post-install: create the application user (adjust host and password).
-- Run separately as an admin; not included above so this file can be committed.
--
--   CREATE USER 'campus_app'@'%' IDENTIFIED BY '<strong-password>';
--   GRANT SELECT, INSERT, UPDATE, DELETE ON campus_connect.* TO 'campus_app'@'%';
--   FLUSH PRIVILEGES;
--
-- The app does not need DDL rights at runtime.
-- ============================================================================
