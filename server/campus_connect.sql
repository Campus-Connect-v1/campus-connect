-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Oct 16, 2025 at 12:49 PM
-- Server version: 8.0.40
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
CREATE DATABASE campus_connect;
USE campus_connect

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `campus_connect`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `log_id` bigint NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL,
  `resource_type` varchar(100) NOT NULL,
  `resource_id` varchar(50) DEFAULT NULL,
  `description` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`log_id`, `user_id`, `action_type`, `resource_type`, `resource_id`, `description`, `ip_address`, `user_agent`, `latitude`, `longitude`, `created_at`) VALUES
(1, 'user_1', 'user_login', 'user', 'user_1', 'User logged in successfully', '192.168.1.100', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(2, 'user_2', 'user_registration', 'user', 'user_2', 'New user registered', '192.168.1.101', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(3, 'user_1', 'connection_request', 'connection', 'conn_1', 'Connection request sent to user_2', '192.168.1.100', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(4, 'user_2', 'connection_accepted', 'connection', 'conn_1', 'Connection request accepted from user_1', '192.168.1.101', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(5, 'user_3', 'group_created', 'study_group', 'group_3', 'Study group created: Physics Study Team', '192.168.1.102', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(6, 'user_1', 'event_created', 'event', 'event_1', 'Event created: CS106 Midterm Review', '192.168.1.100', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(7, 'user_4', 'location_update', 'user', 'user_4', 'User location updated to Gates Building', '192.168.1.103', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(8, 'user_5', 'rsvp_event', 'event', 'event_5', 'User RSVPed to Economics Debate', '192.168.1.104', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(9, 'user_6', 'group_joined', 'study_group', 'group_6', 'User joined study group: Psych Research Group', '192.168.1.105', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(10, 'user_7', 'profile_updated', 'user', 'user_7', 'User profile information updated', '192.168.1.106', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(11, 'user_8', 'connection_request', 'connection', 'conn_8', 'Connection request sent to user_10', '192.168.1.107', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(12, 'user_9', 'event_created', 'event', 'event_9', 'Event created: Business Case Competition', '192.168.1.108', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(13, 'user_10', 'group_created', 'study_group', 'group_10', 'Study group created: Chemistry Lab Prep', '192.168.1.109', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(14, 'user_11', 'user_login', 'user', 'user_11', 'User logged in successfully', '192.168.1.110', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(15, 'user_12', 'location_update', 'user', 'user_12', 'User location updated to Green Library', '192.168.1.111', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(16, 'user_13', 'connection_accepted', 'connection', 'conn_13', 'Connection request accepted from user_11', '192.168.1.112', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(17, 'user_14', 'event_rsvp', 'event', 'event_14', 'User RSVPed to Sociology Research Symposium', '192.168.1.113', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(18, 'user_15', 'group_created', 'study_group', 'group_15', 'Study group created: Historical Research', '192.168.1.114', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(19, 'user_16', 'profile_updated', 'user', 'user_16', 'User profile picture updated', '192.168.1.115', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(20, 'user_17', 'user_login', 'user', 'user_17', 'User logged in successfully', '192.168.1.116', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(21, 'user_18', 'connection_request', 'connection', 'conn_18', 'Connection request sent to user_20', '192.168.1.117', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(22, 'user_19', 'event_created', 'event', 'event_19', 'Event created: Economics Data Workshop', '192.168.1.118', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(23, 'user_20', 'group_joined', 'study_group', 'group_20', 'User joined study group: CS Algorithms', '192.168.1.119', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(24, 'user_21', 'location_update', 'user', 'user_21', 'User location updated to Athletic Center', '192.168.1.120', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(25, 'user_22', 'user_logout', 'user', 'user_22', 'User logged out', '192.168.1.121', NULL, NULL, NULL, '2025-10-15 23:55:56'),
(26, 'user_23', 'connection_accepted', 'connection', 'conn_23', 'Connection request accepted from user_21', '192.168.1.122', NULL, NULL, NULL, '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `campus_buildings`
--

CREATE TABLE `campus_buildings` (
  `building_id` varchar(50) NOT NULL,
  `university_id` varchar(50) NOT NULL,
  `building_code` varchar(20) NOT NULL,
  `building_name` varchar(255) NOT NULL,
  `address` text,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `description` text,
  `building_type` enum('academic','administrative','residential','recreational','dining','library','sports') DEFAULT 'academic',
  `floors` int DEFAULT '1',
  `is_accessible` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `campus_buildings`
--

INSERT INTO `campus_buildings` (`building_id`, `university_id`, `building_code`, `building_name`, `address`, `latitude`, `longitude`, `description`, `building_type`, `floors`, `is_accessible`, `created_at`) VALUES
('bld_1', 'uni_1', 'GATES', 'Gates Computer Science Building', NULL, 37.42750000, -122.16970000, NULL, 'academic', 1, 1, '2025-10-15 23:55:56'),
('bld_10', 'uni_2', 'STATA', 'Stata Center', NULL, 42.36180000, -71.09010000, NULL, 'academic', 1, 1, '2025-10-15 23:55:56'),
('bld_11', 'uni_3', 'SCIENCE', 'Science Center', NULL, 42.37800000, -71.11670000, NULL, 'academic', 1, 1, '2025-10-15 23:55:56'),
('bld_12', 'uni_3', 'WIDENER', 'Widener Library', NULL, 42.37340000, -71.11700000, NULL, 'library', 1, 1, '2025-10-15 23:55:56'),
('bld_13', 'uni_3', 'HARK', 'Harkness Commons', NULL, 42.37750000, -71.11600000, NULL, 'recreational', 1, 1, '2025-10-15 23:55:56'),
('bld_14', 'uni_3', 'MALKIN', 'Malkin Athletic Center', NULL, 42.37280000, -71.11820000, NULL, 'sports', 1, 1, '2025-10-15 23:55:56'),
('bld_15', 'uni_3', 'ANNENB', 'Annenberg Hall', NULL, 42.37420000, -71.11750000, NULL, 'dining', 1, 1, '2025-10-15 23:55:56'),
('bld_16', 'uni_4', 'SODA', 'Soda Hall', NULL, 37.87590000, -122.25870000, NULL, 'academic', 1, 1, '2025-10-15 23:55:56'),
('bld_17', 'uni_4', 'DOE', 'Doe Library', NULL, 37.87230000, -122.25850000, NULL, 'library', 1, 1, '2025-10-15 23:55:56'),
('bld_18', 'uni_4', 'RSF', 'Recreational Sports Facility', NULL, 37.86860000, -122.26090000, NULL, 'sports', 1, 1, '2025-10-15 23:55:56'),
('bld_19', 'uni_4', 'MLK', 'Martin Luther King Center', NULL, 37.87150000, -122.25980000, NULL, 'recreational', 1, 1, '2025-10-15 23:55:56'),
('bld_2', 'uni_1', 'LIB', 'Green Library', NULL, 37.42830000, -122.17010000, NULL, 'library', 1, 1, '2025-10-15 23:55:56'),
('bld_20', 'uni_4', 'GOLDEN', 'Golden Bear Cafe', NULL, 37.87020000, -122.25910000, NULL, 'dining', 1, 1, '2025-10-15 23:55:56'),
('bld_21', 'uni_5', 'EECS', 'Electrical Engineering Building', NULL, 42.29310000, -83.71580000, NULL, 'academic', 1, 1, '2025-10-15 23:55:56'),
('bld_22', 'uni_5', 'SHAP', 'Shapiro Library', NULL, 42.29250000, -83.71620000, NULL, 'library', 1, 1, '2025-10-15 23:55:56'),
('bld_23', 'uni_5', 'CCRB', 'Central Campus Rec Building', NULL, 42.29380000, -83.71490000, NULL, 'sports', 1, 1, '2025-10-15 23:55:56'),
('bld_24', 'uni_5', 'UNION', 'Michigan Union', NULL, 42.29290000, -83.71550000, NULL, 'recreational', 1, 1, '2025-10-15 23:55:56'),
('bld_25', 'uni_5', 'MOJO', 'MoJo Dining Hall', NULL, 42.29350000, -83.71430000, NULL, 'dining', 1, 1, '2025-10-15 23:55:56'),
('bld_3', 'uni_1', 'STLC', 'Student Center', NULL, 37.42680000, -122.16890000, NULL, 'recreational', 1, 1, '2025-10-15 23:55:56'),
('bld_4', 'uni_1', 'GYM', 'Athletic Center', NULL, 37.42910000, -122.17120000, NULL, 'sports', 1, 1, '2025-10-15 23:55:56'),
('bld_5', 'uni_1', 'CAFE', 'Main Campus Cafe', NULL, 37.42790000, -122.16930000, NULL, 'dining', 1, 1, '2025-10-15 23:55:56'),
('bld_6', 'uni_2', 'EECS', 'Electrical Engineering Building', NULL, 42.36010000, -71.09420000, NULL, 'academic', 1, 1, '2025-10-15 23:55:56'),
('bld_7', 'uni_2', 'HAYDEN', 'Hayden Library', NULL, 42.35980000, -71.09370000, NULL, 'library', 1, 1, '2025-10-15 23:55:56'),
('bld_8', 'uni_2', 'W20', 'Student Center', NULL, 42.36050000, -71.09480000, NULL, 'recreational', 1, 1, '2025-10-15 23:55:56'),
('bld_9', 'uni_2', 'ZESIG', 'Zesiger Sports Center', NULL, 42.36120000, -71.09530000, NULL, 'sports', 1, 1, '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `campus_facilities`
--

CREATE TABLE `campus_facilities` (
  `facility_id` varchar(50) NOT NULL,
  `building_id` varchar(50) NOT NULL,
  `facility_name` varchar(255) NOT NULL,
  `floor` int DEFAULT '1',
  `room_number` varchar(20) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `facility_type` enum('classroom','lab','study_room','office','cafe','lounge','library','gym','other') DEFAULT 'other',
  `description` text,
  `operating_hours` text,
  `is_reservable` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `campus_facilities`
--

INSERT INTO `campus_facilities` (`facility_id`, `building_id`, `facility_name`, `floor`, `room_number`, `capacity`, `facility_type`, `description`, `operating_hours`, `is_reservable`, `created_at`) VALUES
('fac_1', 'bld_1', 'Computer Lab 101', 1, '101', 30, 'lab', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_10', 'bld_5', 'Main Dining Hall', 1, 'Dining', 200, 'cafe', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_11', 'bld_6', 'Circuit Lab', 1, '101', 20, 'lab', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_12', 'bld_6', 'Robotics Workshop', 2, '201', 15, 'lab', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_13', 'bld_7', 'Silent Reading Room', 4, '401', 25, 'library', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_14', 'bld_7', 'Media Center', 1, '101', 40, 'library', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_15', 'bld_8', 'Music Practice Room', 2, '205', 4, 'lounge', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_16', 'bld_9', 'Swimming Pool', 1, 'Pool', 50, 'gym', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_17', 'bld_9', 'Yoga Studio', 2, '201', 20, 'gym', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_18', 'bld_10', 'AI Research Center', 3, '301', 25, 'lab', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_19', 'bld_11', 'Chemistry Lab', 2, '201', 24, 'lab', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_2', 'bld_1', 'Study Room A', 2, '201', 8, 'study_room', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_20', 'bld_12', 'Rare Books Room', 5, '501', 10, 'library', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_21', 'bld_13', 'TV Lounge', 1, '101', 30, 'lounge', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_22', 'bld_14', 'Rock Climbing Wall', 1, 'Wall', 15, 'gym', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_23', 'bld_15', 'Freshman Dining', 1, 'Main', 300, 'cafe', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_24', 'bld_16', 'Data Science Lab', 2, '201', 35, 'lab', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_25', 'bld_17', '24/7 Study Area', 1, '101', 60, 'library', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_3', 'bld_1', 'AI Research Lab', 3, '301', 15, 'lab', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_4', 'bld_2', 'Quiet Study Area', 2, '205', 50, 'library', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_5', 'bld_2', 'Group Study Room 1', 3, '305', 12, 'study_room', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_6', 'bld_3', 'Game Room', 1, '101', 25, 'lounge', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_7', 'bld_3', 'Student Lounge', 2, '201', 40, 'lounge', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_8', 'bld_4', 'Basketball Court', 1, 'Court 1', 100, 'gym', NULL, NULL, 0, '2025-10-15 23:55:56'),
('fac_9', 'bld_4', 'Weight Room', 2, '201', 30, 'gym', NULL, NULL, 0, '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `connections`
--

CREATE TABLE `connections` (
  `connection_id` varchar(50) NOT NULL,
  `requester_id` varchar(50) NOT NULL,
  `receiver_id` varchar(50) NOT NULL,
  `status` enum('pending','accepted','blocked','declined') DEFAULT 'pending',
  `connection_note` varchar(255) DEFAULT NULL,
  `shared_courses` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `connections`
--

INSERT INTO `connections` (`connection_id`, `requester_id`, `receiver_id`, `status`, `connection_note`, `shared_courses`, `created_at`, `updated_at`) VALUES
('conn_1', 'user_1', 'user_2', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_10', 'user_8', 'user_10', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_11', 'user_9', 'user_11', 'pending', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_12', 'user_10', 'user_12', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_13', 'user_11', 'user_13', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_14', 'user_12', 'user_14', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_15', 'user_13', 'user_15', 'pending', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_16', 'user_14', 'user_16', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_17', 'user_15', 'user_17', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_18', 'user_16', 'user_18', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_19', 'user_17', 'user_19', 'pending', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_2', 'user_1', 'user_3', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_20', 'user_18', 'user_20', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_21', 'user_19', 'user_21', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_22', 'user_20', 'user_22', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_23', 'user_21', 'user_23', 'pending', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_24', 'user_22', 'user_24', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_25', 'user_23', 'user_25', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_3', 'user_2', 'user_3', 'pending', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_4', 'user_1', 'user_4', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_5', 'user_3', 'user_5', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_6', 'user_4', 'user_6', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_7', 'user_5', 'user_7', 'pending', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_8', 'user_6', 'user_8', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('conn_9', 'user_7', 'user_9', 'accepted', NULL, NULL, '2025-10-15 23:55:56', '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `event_id` varchar(50) NOT NULL,
  `university_id` varchar(50) NOT NULL,
  `created_by` varchar(50) NOT NULL,
  `event_title` varchar(255) NOT NULL,
  `event_description` text,
  `event_type` enum('academic','social','sports','career','club','workshop') DEFAULT 'social',
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `is_recurring` tinyint(1) DEFAULT '0',
  `recurrence_pattern` varchar(100) DEFAULT NULL,
  `location_type` enum('physical','virtual','hybrid') DEFAULT 'physical',
  `physical_location` varchar(500) DEFAULT NULL,
  `virtual_link` varchar(500) DEFAULT NULL,
  `max_attendees` int DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '1',
  `requires_rsvp` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`event_id`, `university_id`, `created_by`, `event_title`, `event_description`, `event_type`, `start_time`, `end_time`, `is_recurring`, `recurrence_pattern`, `location_type`, `physical_location`, `virtual_link`, `max_attendees`, `is_public`, `requires_rsvp`, `created_at`, `updated_at`) VALUES
('event_1', 'uni_1', 'user_1', 'CS106 Midterm Review', 'Comprehensive review session for CS106 midterm exam', 'academic', '2024-01-15 18:00:00', '2024-01-15 20:00:00', 0, NULL, 'physical', 'Gates Building Room 101', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_10', 'uni_5', 'user_10', 'Chemistry Lab Safety', 'Mandatory lab safety training session', 'workshop', '2024-01-24 13:00:00', '2024-01-24 15:00:00', 0, NULL, 'physical', 'Chemistry Building Lab 101', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_11', 'uni_6', 'user_11', 'Poetry Reading Night', 'Evening of poetry reading and discussion', 'social', '2024-01-25 19:00:00', '2024-01-25 21:00:00', 0, NULL, 'physical', 'Butler Library Reading Room', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_12', 'uni_6', 'user_12', 'Art Exhibition Opening', 'Opening reception for student art exhibition', 'social', '2024-01-26 17:00:00', '2024-01-26 19:00:00', 0, NULL, 'physical', 'Dodge Hall Gallery', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_13', 'uni_7', 'user_13', 'Film Screening', 'Screening of student short films', 'social', '2024-01-27 19:30:00', '2024-01-27 22:00:00', 0, NULL, 'physical', 'James Bridges Theater', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_14', 'uni_7', 'user_14', 'Sociology Research Symposium', 'Presentation of undergraduate sociology research', 'academic', '2024-01-28 14:00:00', '2024-01-28 17:00:00', 0, NULL, 'physical', 'Haines Hall Auditorium', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_15', 'uni_8', 'user_15', 'History Documentary Night', 'Screening and discussion of historical documentaries', 'social', '2024-01-29 18:00:00', '2024-01-29 20:00:00', 0, NULL, 'physical', 'Linsly-Chittenden Hall', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_16', 'uni_8', 'user_16', 'Math Puzzle Competition', 'Fun math puzzle and problem solving competition', 'social', '2024-01-30 16:00:00', '2024-01-30 18:00:00', 0, NULL, 'physical', 'Dunham Laboratory', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_17', 'uni_9', 'user_17', 'Philosophy Discussion Circle', 'Open discussion on ethical philosophy', 'academic', '2024-01-31 17:00:00', '2024-01-31 19:00:00', 0, NULL, 'physical', '1879 Hall Seminar Room', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_18', 'uni_9', 'user_18', 'Biology Field Trip', 'Field trip to local nature reserve', 'academic', '2024-02-01 08:00:00', '2024-02-01 16:00:00', 0, NULL, 'physical', 'Meet at Guyot Hall', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_19', 'uni_10', 'user_19', 'Economics Data Workshop', 'Hands-on workshop with economic datasets', 'workshop', '2024-02-02 13:00:00', '2024-02-02 16:00:00', 0, NULL, 'physical', 'Social Sciences Research Building', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_2', 'uni_1', 'user_2', 'Biology Study Session', 'Group study session for upcoming biology quiz', 'academic', '2024-01-16 16:00:00', '2024-01-16 18:00:00', 0, NULL, 'physical', 'Green Library Study Room 2', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_20', 'uni_10', 'user_20', 'CS Coding Marathon', '24-hour coding marathon and hackathon', 'academic', '2024-02-03 12:00:00', '2024-02-04 12:00:00', 0, NULL, 'physical', 'Crerar Library Computer Lab', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_21', 'uni_11', 'user_21', 'Aerospace Design Review', 'Review of aerospace engineering design projects', 'academic', '2024-02-04 14:00:00', '2024-02-04 17:00:00', 0, NULL, 'physical', 'Guggenheim Building Lab', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_22', 'uni_11', 'user_22', 'Physics Colloquium', 'Guest speaker on quantum computing', 'academic', '2024-02-05 16:00:00', '2024-02-05 18:00:00', 0, NULL, 'physical', 'East Bridge Auditorium', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_23', 'uni_12', 'user_23', 'Hotel Management Workshop', 'Workshop on hotel operations and management', 'career', '2024-02-06 10:00:00', '2024-02-06 15:00:00', 0, NULL, 'physical', 'Statler Hotel Conference Room', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_24', 'uni_12', 'user_24', 'Agriculture Tech Demo', 'Demonstration of new agricultural technology', 'workshop', '2024-02-07 11:00:00', '2024-02-07 13:00:00', 0, NULL, 'physical', 'Agricultural Sciences Building', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_25', 'uni_13', 'user_25', 'Finance Networking Event', 'Networking event with finance professionals', 'career', '2024-02-08 17:00:00', '2024-02-08 19:00:00', 0, NULL, 'physical', 'Huntsman Hall Atrium', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_3', 'uni_2', 'user_3', 'Physics Problem Solving', 'Collaborative physics problem solving workshop', 'academic', '2024-01-17 17:00:00', '2024-01-17 19:00:00', 0, NULL, 'physical', 'EECS Building Lab 201', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_4', 'uni_2', 'user_4', 'Math Competition Prep', 'Preparation for upcoming mathematics competition', 'academic', '2024-01-18 15:00:00', '2024-01-18 17:00:00', 0, NULL, 'physical', 'Hayden Library Room 305', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_5', 'uni_3', 'user_5', 'Economics Debate', 'Debate on current economic policies and theories', 'academic', '2024-01-19 19:00:00', '2024-01-19 21:00:00', 0, NULL, 'physical', 'Science Center Auditorium', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_6', 'uni_3', 'user_6', 'Psychology Research Workshop', 'Workshop on research methodology in psychology', 'workshop', '2024-01-20 14:00:00', '2024-01-20 16:00:00', 0, NULL, 'physical', 'William James Hall Room 105', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_7', 'uni_4', 'user_7', 'Circuit Design Competition', 'Annual circuit design competition for EE students', 'academic', '2024-01-21 10:00:00', '2024-01-21 16:00:00', 0, NULL, 'physical', 'Soda Hall Main Lab', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_8', 'uni_4', 'user_8', 'Political Science Seminar', 'Guest speaker on international relations', 'academic', '2024-01-22 18:00:00', '2024-01-22 20:00:00', 0, NULL, 'physical', 'Doe Library Conference Room', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('event_9', 'uni_5', 'user_9', 'Business Case Competition', 'Real-world business case analysis competition', 'career', '2024-01-23 09:00:00', '2024-01-23 17:00:00', 0, NULL, 'physical', 'Ross School of Business', NULL, NULL, 1, 0, '2025-10-15 23:55:56', '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `event_attendees`
--

CREATE TABLE `event_attendees` (
  `attendee_id` varchar(50) NOT NULL,
  `event_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `rsvp_status` enum('going','interested','not_going') DEFAULT 'interested',
  `check_in_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `event_attendees`
--

INSERT INTO `event_attendees` (`attendee_id`, `event_id`, `user_id`, `rsvp_status`, `check_in_time`, `created_at`) VALUES
('ea_1', 'event_1', 'user_1', 'going', NULL, '2025-10-15 23:55:56'),
('ea_10', 'event_5', 'user_5', 'going', NULL, '2025-10-15 23:55:56'),
('ea_11', 'event_5', 'user_7', 'interested', NULL, '2025-10-15 23:55:56'),
('ea_12', 'event_6', 'user_6', 'going', NULL, '2025-10-15 23:55:56'),
('ea_13', 'event_6', 'user_8', 'going', NULL, '2025-10-15 23:55:56'),
('ea_14', 'event_7', 'user_7', 'going', NULL, '2025-10-15 23:55:56'),
('ea_15', 'event_7', 'user_9', 'interested', NULL, '2025-10-15 23:55:56'),
('ea_16', 'event_8', 'user_8', 'going', NULL, '2025-10-15 23:55:56'),
('ea_17', 'event_8', 'user_10', 'going', NULL, '2025-10-15 23:55:56'),
('ea_18', 'event_9', 'user_9', 'going', NULL, '2025-10-15 23:55:56'),
('ea_19', 'event_9', 'user_11', 'interested', NULL, '2025-10-15 23:55:56'),
('ea_2', 'event_1', 'user_2', 'going', NULL, '2025-10-15 23:55:56'),
('ea_20', 'event_10', 'user_10', 'going', NULL, '2025-10-15 23:55:56'),
('ea_21', 'event_10', 'user_12', 'going', NULL, '2025-10-15 23:55:56'),
('ea_22', 'event_11', 'user_11', 'going', NULL, '2025-10-15 23:55:56'),
('ea_23', 'event_11', 'user_13', 'interested', NULL, '2025-10-15 23:55:56'),
('ea_24', 'event_12', 'user_12', 'going', NULL, '2025-10-15 23:55:56'),
('ea_25', 'event_12', 'user_14', 'going', NULL, '2025-10-15 23:55:56'),
('ea_3', 'event_1', 'user_3', 'interested', NULL, '2025-10-15 23:55:56'),
('ea_4', 'event_2', 'user_2', 'going', NULL, '2025-10-15 23:55:56'),
('ea_5', 'event_2', 'user_4', 'going', NULL, '2025-10-15 23:55:56'),
('ea_6', 'event_3', 'user_3', 'going', NULL, '2025-10-15 23:55:56'),
('ea_7', 'event_3', 'user_5', 'interested', NULL, '2025-10-15 23:55:56'),
('ea_8', 'event_4', 'user_4', 'going', NULL, '2025-10-15 23:55:56'),
('ea_9', 'event_4', 'user_6', 'going', NULL, '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `group_members`
--

CREATE TABLE `group_members` (
  `group_member_id` varchar(50) NOT NULL,
  `group_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `role` enum('creator','admin','member') DEFAULT 'member',
  `notification_preferences` enum('all','important','none') DEFAULT 'all',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_active` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `group_members`
--

INSERT INTO `group_members` (`group_member_id`, `group_id`, `user_id`, `role`, `notification_preferences`, `joined_at`, `last_active`) VALUES
('gm_1', 'group_1', 'user_1', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_10', 'group_5', 'user_5', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_11', 'group_5', 'user_7', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_12', 'group_6', 'user_6', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_13', 'group_6', 'user_8', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_14', 'group_7', 'user_7', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_15', 'group_7', 'user_9', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_16', 'group_8', 'user_8', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_17', 'group_8', 'user_10', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_18', 'group_9', 'user_9', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_19', 'group_9', 'user_11', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_2', 'group_1', 'user_2', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_20', 'group_10', 'user_10', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_21', 'group_10', 'user_12', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_22', 'group_11', 'user_11', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_23', 'group_11', 'user_13', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_24', 'group_12', 'user_12', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_25', 'group_12', 'user_14', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_3', 'group_1', 'user_3', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_4', 'group_2', 'user_2', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_5', 'group_2', 'user_4', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_6', 'group_3', 'user_3', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_7', 'group_3', 'user_5', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_8', 'group_4', 'user_4', 'creator', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('gm_9', 'group_4', 'user_6', 'member', 'all', '2025-10-15 23:55:56', '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `otps`
--

CREATE TABLE `otps` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `otps`
--

INSERT INTO `otps` (`id`, `email`, `otp_code`, `expires_at`, `created_at`) VALUES
(2, 'john@stanfor.edu', '728345', '2025-10-16 02:12:35', '2025-10-16 02:02:35'),
(3, 'john@stanford3.edu', '713726', '2025-10-16 07:20:17', '2025-10-16 07:10:16'),
(4, 'john@stanford4.edu', '994670', '2025-10-16 07:25:25', '2025-10-16 07:15:25'),
(6, 'john@stanford.edu', '196422', '2025-10-16 07:40:24', '2025-10-16 07:30:24'),
(7, 'leslie@stanford5.edu', '951738', '2025-10-16 07:47:45', '2025-10-16 07:37:44'),
(8, 'leslie@stanford.edu', '696121', '2025-10-16 07:48:36', '2025-10-16 07:38:35'),
(9, 'leslieajayi@stanford.edu', '628938', '2025-10-16 08:03:08', '2025-10-16 07:53:08'),
(10, 'leslieajayi27@stanford.edu', '740030', '2025-10-16 08:05:48', '2025-10-16 07:55:48');

-- --------------------------------------------------------

--
-- Table structure for table `study_groups`
--

CREATE TABLE `study_groups` (
  `group_id` varchar(50) NOT NULL,
  `university_id` varchar(50) NOT NULL,
  `group_name` varchar(255) NOT NULL,
  `description` text,
  `course_code` varchar(50) DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `group_type` enum('public','private','invite_only') DEFAULT 'public',
  `max_members` int DEFAULT '20',
  `meeting_frequency` enum('weekly','biweekly','monthly','custom') DEFAULT 'weekly',
  `preferred_location_type` enum('virtual','campus','hybrid') DEFAULT 'campus',
  `created_by` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `study_groups`
--

INSERT INTO `study_groups` (`group_id`, `university_id`, `group_name`, `description`, `course_code`, `course_name`, `group_type`, `max_members`, `meeting_frequency`, `preferred_location_type`, `created_by`, `is_active`, `created_at`, `updated_at`) VALUES
('group_1', 'uni_1', 'CS106 Study Group', 'Study group for Introduction to Programming', 'CS106', 'Programming Methodology', 'public', 20, 'weekly', 'campus', 'user_1', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_10', 'uni_5', 'Chemistry Lab Prep', 'Weekly chemistry lab preparation sessions', 'CHEM125', 'Organic Chemistry', 'public', 20, 'weekly', 'campus', 'user_10', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_11', 'uni_6', 'Literature Analysis', 'Critical analysis of literary works', 'ENGL201', 'British Literature', 'public', 20, 'weekly', 'campus', 'user_11', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_12', 'uni_6', 'Art History Society', 'Discussion of art movements and history', 'ARTH101', 'Art History Survey', 'public', 20, 'weekly', 'campus', 'user_12', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_13', 'uni_7', 'Film Production', 'Collaborative film production projects', 'FILM301', 'Digital Filmmaking', 'private', 20, 'weekly', 'campus', 'user_13', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_14', 'uni_7', 'Sociology Research', 'Sociological research methods practice', 'SOC201', 'Social Theory', 'public', 20, 'weekly', 'campus', 'user_14', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_15', 'uni_8', 'Historical Research', 'Historical document analysis and research', 'HIST250', 'World History', 'invite_only', 20, 'weekly', 'campus', 'user_15', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_16', 'uni_8', 'Advanced Calculus', 'Advanced calculus problem solving sessions', 'MATH350', 'Multivariable Calculus', 'public', 20, 'weekly', 'campus', 'user_16', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_17', 'uni_9', 'Philosophy Circle', 'Discussion of philosophical texts and ideas', 'PHIL101', 'Introduction to Philosophy', 'public', 20, 'weekly', 'campus', 'user_17', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_18', 'uni_9', 'Molecular Bio Lab', 'Molecular biology laboratory techniques', 'BIO301', 'Molecular Biology', 'private', 20, 'weekly', 'campus', 'user_18', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_19', 'uni_10', 'Economic Modeling', 'Advanced economic modeling techniques', 'ECON301', 'Econometrics', 'invite_only', 20, 'weekly', 'campus', 'user_19', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_2', 'uni_1', 'Bio101 Review', 'Weekly review sessions for Biology 101', 'BIO101', 'Introduction to Biology', 'public', 20, 'weekly', 'campus', 'user_2', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_20', 'uni_10', 'CS Algorithms', 'Algorithm design and analysis practice', 'CS301', 'Data Structures', 'public', 20, 'weekly', 'campus', 'user_20', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_21', 'uni_11', 'Aerospace Design', 'Aerospace engineering design projects', 'AE201', 'Aerodynamics', 'public', 20, 'weekly', 'campus', 'user_21', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_22', 'uni_11', 'Quantum Physics', 'Quantum mechanics problem solving', 'PHYS450', 'Quantum Mechanics', 'private', 20, 'weekly', 'campus', 'user_22', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_23', 'uni_12', 'Hotel Management', 'Hotel and hospitality management case studies', 'HADM301', 'Hotel Operations', 'public', 20, 'weekly', 'campus', 'user_23', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_24', 'uni_12', 'Agricultural Science', 'Agricultural research and techniques', 'AGSCI201', 'Crop Science', 'invite_only', 20, 'weekly', 'campus', 'user_24', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_25', 'uni_13', 'Finance Club', 'Financial analysis and investment strategies', 'FNCE301', 'Corporate Finance', 'public', 20, 'weekly', 'campus', 'user_25', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_3', 'uni_2', 'Physics Study Team', 'Collaborative physics problem solving', 'PHYS801', 'Classical Mechanics', 'public', 20, 'weekly', 'campus', 'user_3', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_4', 'uni_2', 'Math Circle', 'Advanced mathematics discussion group', 'MATH202', 'Linear Algebra', 'invite_only', 20, 'weekly', 'campus', 'user_4', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_5', 'uni_3', 'Economics Forum', 'Discussion of economic theories and applications', 'ECON101', 'Principles of Economics', 'public', 20, 'weekly', 'campus', 'user_5', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_6', 'uni_3', 'Psych Research Group', 'Psychology research methodology practice', 'PSYCH150', 'Research Methods', 'private', 20, 'weekly', 'campus', 'user_6', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_7', 'uni_4', 'EE Circuit Design', 'Electrical engineering circuit design projects', 'EE101', 'Circuit Analysis', 'public', 20, 'weekly', 'campus', 'user_7', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_8', 'uni_4', 'PolSci Debate Club', 'Political science debate and discussion', 'POLSCI201', 'Comparative Politics', 'public', 20, 'weekly', 'campus', 'user_8', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('group_9', 'uni_5', 'Business Strategy', 'Case studies in business strategy', 'BUS401', 'Strategic Management', 'invite_only', 20, 'weekly', 'campus', 'user_9', 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `universities`
--

CREATE TABLE `universities` (
  `university_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `domain` varchar(100) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `universities`
--

INSERT INTO `universities` (`university_id`, `name`, `domain`, `address`, `city`, `state`, `country`, `logo_url`, `is_verified`, `created_at`, `updated_at`) VALUES
('uni_1', 'Stanford University', 'stanford.edu', '450 Serra Mall', 'Stanford', 'CA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_10', 'University of Chicago', 'uchicago.edu', '5801 S Ellis Ave', 'Chicago', 'IL', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_11', 'Caltech', 'caltech.edu', '1200 E California Blvd', 'Pasadena', 'CA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_12', 'Cornell University', 'cornell.edu', '300 Day Hall', 'Ithaca', 'NY', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_13', 'University of Pennsylvania', 'upenn.edu', '3451 Walnut St', 'Philadelphia', 'PA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_14', 'Johns Hopkins University', 'jhu.edu', '3400 N Charles St', 'Baltimore', 'MD', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_15', 'Northwestern University', 'northwestern.edu', '633 Clark St', 'Evanston', 'IL', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_16', 'Duke University', 'duke.edu', '207 Allen Building', 'Durham', 'NC', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_17', 'Brown University', 'brown.edu', '1 Prospect St', 'Providence', 'RI', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_18', 'University of Texas at Austin', 'utexas.edu', '110 Inner Campus Dr', 'Austin', 'TX', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_19', 'University of Washington', 'uw.edu', '1410 NE Campus Parkway', 'Seattle', 'WA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_2', 'MIT', 'mit.edu', '77 Massachusetts Ave', 'Cambridge', 'MA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_20', 'Carnegie Mellon University', 'cmu.edu', '5000 Forbes Ave', 'Pittsburgh', 'PA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_21', 'University of Southern California', 'usc.edu', '3551 Trousdale Pkwy', 'Los Angeles', 'CA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_22', 'New York University', 'nyu.edu', '70 Washington Sq S', 'New York', 'NY', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_23', 'University of Illinois Urbana-Champaign', 'illinois.edu', '601 E John St', 'Champaign', 'IL', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_24', 'Georgia Institute of Technology', 'gatech.edu', '225 North Ave NW', 'Atlanta', 'GA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_25', 'University of California San Diego', 'ucsd.edu', '9500 Gilman Dr', 'La Jolla', 'CA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_3', 'Harvard University', 'harvard.edu', 'Massachusetts Hall', 'Cambridge', 'MA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_4', 'UC Berkeley', 'berkeley.edu', '200 California Hall', 'Berkeley', 'CA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_5', 'University of Michigan', 'umich.edu', '500 S State St', 'Ann Arbor', 'MI', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_6', 'Columbia University', 'columbia.edu', '116th St & Broadway', 'New York', 'NY', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_7', 'UCLA', 'ucla.edu', '405 Hilgard Ave', 'Los Angeles', 'CA', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_8', 'Yale University', 'yale.edu', '149 Elm St', 'New Haven', 'CT', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56'),
('uni_9', 'Princeton University', 'princeton.edu', 'Nassau Hall', 'Princeton', 'NJ', 'USA', NULL, 1, '2025-10-15 23:55:56', '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `university_departments`
--

CREATE TABLE `university_departments` (
  `department_id` varchar(50) NOT NULL,
  `university_id` varchar(50) NOT NULL,
  `department_code` varchar(20) NOT NULL,
  `department_name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `university_departments`
--

INSERT INTO `university_departments` (`department_id`, `university_id`, `department_code`, `department_name`, `description`, `created_at`) VALUES
('dept_1', 'uni_1', 'CS', 'Computer Science', NULL, '2025-10-15 23:55:56'),
('dept_10', 'uni_2', 'AERO', 'Aeronautics and Astronautics', NULL, '2025-10-15 23:55:56'),
('dept_11', 'uni_3', 'ECON', 'Economics', NULL, '2025-10-15 23:55:56'),
('dept_12', 'uni_3', 'PSY', 'Psychology', NULL, '2025-10-15 23:55:56'),
('dept_13', 'uni_3', 'GOV', 'Government', NULL, '2025-10-15 23:55:56'),
('dept_14', 'uni_3', 'HIST', 'History', NULL, '2025-10-15 23:55:56'),
('dept_15', 'uni_3', 'SOC', 'Sociology', NULL, '2025-10-15 23:55:56'),
('dept_16', 'uni_4', 'EE', 'Electrical Engineering', NULL, '2025-10-15 23:55:56'),
('dept_17', 'uni_4', 'POLSCI', 'Political Science', NULL, '2025-10-15 23:55:56'),
('dept_18', 'uni_4', 'COMSCI', 'Computer Science', NULL, '2025-10-15 23:55:56'),
('dept_19', 'uni_4', 'BIO', 'Biology', NULL, '2025-10-15 23:55:56'),
('dept_2', 'uni_1', 'BIO', 'Biology', NULL, '2025-10-15 23:55:56'),
('dept_20', 'uni_4', 'CHEM', 'Chemistry', NULL, '2025-10-15 23:55:56'),
('dept_21', 'uni_5', 'BUS', 'Business Administration', NULL, '2025-10-15 23:55:56'),
('dept_22', 'uni_5', 'CHEM', 'Chemistry', NULL, '2025-10-15 23:55:56'),
('dept_23', 'uni_5', 'ENGR', 'Engineering', NULL, '2025-10-15 23:55:56'),
('dept_24', 'uni_5', 'PSY', 'Psychology', NULL, '2025-10-15 23:55:56'),
('dept_25', 'uni_5', 'SOC', 'Sociology', NULL, '2025-10-15 23:55:56'),
('dept_3', 'uni_1', 'MATH', 'Mathematics', NULL, '2025-10-15 23:55:56'),
('dept_4', 'uni_1', 'PHYS', 'Physics', NULL, '2025-10-15 23:55:56'),
('dept_5', 'uni_1', 'ECON', 'Economics', NULL, '2025-10-15 23:55:56'),
('dept_6', 'uni_2', 'EECS', 'Electrical Engineering & Computer Science', NULL, '2025-10-15 23:55:56'),
('dept_7', 'uni_2', 'MECH', 'Mechanical Engineering', NULL, '2025-10-15 23:55:56'),
('dept_8', 'uni_2', 'PHYS', 'Physics', NULL, '2025-10-15 23:55:56'),
('dept_9', 'uni_2', 'MATH', 'Mathematics', NULL, '2025-10-15 23:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(50) NOT NULL,
  `university_id` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `profile_picture_url` varchar(500) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `program` varchar(100) DEFAULT NULL,
  `graduation_year` int DEFAULT NULL,
  `bio` text,
  `date_of_birth` date DEFAULT NULL,
  `show_location_preference` enum('friends','university','none') DEFAULT 'friends',
  `show_status_preference` enum('friends','university','none') DEFAULT 'friends',
  `is_active` tinyint(1) DEFAULT '1',
  `is_email_verified` tinyint(1) DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `university_id`, `email`, `password_hash`, `first_name`, `last_name`, `profile_picture_url`, `phone_number`, `program`, `graduation_year`, `bio`, `date_of_birth`, `show_location_preference`, `show_status_preference`, `is_active`, `is_email_verified`, `last_login`, `created_at`, `updated_at`) VALUES
('611296a8-9873-4f8f-83c0-9b3aa583a814', 'uni_2', 'leslieajayi28@stanford.edu', '$2b$12$L.8UW9ArBSpm7VDhoq9tJ.RrqDolb1xUGHmCaerHIzQnExlMx8pEy', 'Doe', 'John', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 1, NULL, '2025-10-16 07:56:32', '2025-10-16 07:57:36'),
('76ac7caa-da34-46aa-922b-2441e351ef21', 'uni_2', 'leslieajayi@stanford.edu', '$2b$12$GUyp1IpWSYAbMxmEsRnqcubp4p33PumBp8Xm9QZ3RTXpmmsGYMoJ6', 'Doe', 'John', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-16 07:53:08', '2025-10-16 07:53:08'),
('af36d018-a31e-44be-b0d6-551bbfafdd39', 'uni_2', 'leslieajayi27@stanford.edu', '$2b$12$obkK2nSDxDpWsY9Z4JANf.Z/vy3imcANfAurgwesVRIJrEmKDmQT.', 'Doe', 'John', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-16 07:55:48', '2025-10-16 07:55:48'),
('user_1', 'uni_1', 'jsmith@stanford.edu', '$2b$12$LtRYh7QVMI12GPJK5mkcK.6OGuQPI6QoqViDYc/XZLDfh5AvScLN2', 'John', 'Smith', NULL, NULL, 'Computer Science', 2025, NULL, NULL, 'friends', 'friends', 1, 1, NULL, '2025-10-15 23:55:56', '2025-10-16 02:17:07'),
('user_10', 'uni_5', 'kanderson@umich.edu', '$2b$12$vH66ZtyXe9XP3maIwz0xfevWR3Jv19fRrSIZ7sO6KyJh0QzCr8EPy', 'Karen', 'Anderson', NULL, NULL, 'Chemistry', 2026, NULL, NULL, 'university', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_11', 'uni_6', 'jtaylor@columbia.edu', '$2b$12$dOUaNi0g8dzyZuRVS.zsI.3IRHSEH2yGsr.aD5TReYvyHx6KAHQuK', 'James', 'Taylor', NULL, NULL, 'English Literature', 2024, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_12', 'uni_6', 'pthomas@columbia.edu', '$2b$12$R1xxK3P4xC1x9z2zjXnfU.qIb0hYqIyhHlhILZTgNwIXjb4NggVJm', 'Patricia', 'Thomas', NULL, NULL, 'Art History', 2025, NULL, NULL, 'university', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_13', 'uni_7', 'mhernandez@ucla.edu', '$2b$12$eo63y4rIibx9FRvYhxA0lO1rDUJnVAQbTaVj/jUPvsFVnKlCpwdz2', 'Matthew', 'Hernandez', NULL, NULL, 'Film Studies', 2026, NULL, NULL, 'friends', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_14', 'uni_7', 'jmoore@ucla.edu', '$2b$12$ycZHfrDAsKQjC52kGGl4eub107puhTrEHCpU1QmyUZHvh9t2ON0BW', 'Jennifer', 'Moore', NULL, NULL, 'Sociology', 2024, NULL, NULL, 'university', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_15', 'uni_8', 'cjackson@yale.edu', '$2b$12$5DaQ80cqzUNPQlBeakXpb.qqMrtsejjG2.M1xvSjsdXGT4VeyJKb2', 'Christopher', 'Jackson', NULL, NULL, 'History', 2025, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_16', 'uni_8', 'amartin@yale.edu', '$2b$12$/VqaGqpERH0RD2xmbxk5ouScUAHoZYxD1r7jnM0EdysBvWUNEQiG6', 'Amanda', 'Martin', NULL, NULL, 'Mathematics', 2026, NULL, NULL, 'university', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_17', 'uni_9', 'jlee@princeton.edu', '$2b$12$Pwg6eLXOUmveCg17GJoT2ee0QfM5F0s8NIIyOn.PTXVRKtH4zJDqC', 'Joshua', 'Lee', NULL, NULL, 'Philosophy', 2024, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_1760580138760', 'uni_1', 'john@stanford.edu', '$2b$12$paZTC4wGuc4uVA8QyaD.F.R8xDZh9DjIPMDjfikvttRhJ1afh4kxa', 'John', 'Doe', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-16 02:02:18', '2025-10-16 08:05:04'),
('user_1760580155322', 'uni_1', 'john@stanfor.edu', '$2b$12$TCWO192zi0sOKd3oXfFBlOCuna6xTYIQV1rul7RKUFTmKGMPpzBM.', 'John', 'Doe', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-16 02:02:35', '2025-10-16 02:02:35'),
('user_1760598616804', 'uni_1', 'john@stanford3.edu', '$2b$12$GbDs6cX4YN0NlA0Z4Gyrbe3EW0ealBZg6Aranx3RHDCcSoovthpuy', 'John', 'Doe', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-16 07:10:16', '2025-10-16 07:10:16'),
('user_1760598925036', 'uni_1', 'john@stanford4.edu', '$2b$12$t.H0Jso1yCBheJEXJQ82geN4llYM9kLj1ERco0D1ZI8JWqnN/u9gS', 'John', 'Doe', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-16 07:15:25', '2025-10-16 07:15:25'),
('user_1760599613855', 'uni_2', 'john@stanford5.edu', '$2b$12$sbLRytDkX1ZBr1WRNmQkHelG7FZrsljUztmJ.ltgcA.7cpdy4tgBe', 'John', 'Doe', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 1, NULL, '2025-10-16 07:26:53', '2025-10-16 07:28:22'),
('user_1760600264763', 'uni_2', 'leslie@stanford5.edu', '$2b$12$sBIY3AUMNhqzJcLVr1HIquBA7UL4KGDS/27G5KYkXItyQsY6tawKy', 'John', 'Doe', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-16 07:37:44', '2025-10-16 07:37:44'),
('user_1760600315598', 'uni_2', 'leslie@stanford.edu', '$2b$12$8yNCtPbjpKrSt9.nz8ClWewwt9/NVv1d/6T3/qUo1yhaOhRmK7jSa', 'John', 'Doe', NULL, NULL, NULL, NULL, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-16 07:38:35', '2025-10-16 07:38:35'),
('user_18', 'uni_9', 'mperez@princeton.edu', '$2b$12$3z5yp2Oj2Br6dYl47gL4EOKpd.wjqwGoXLwnBUAAqeV7Vn9/ZZj12', 'Michelle', 'Perez', NULL, NULL, 'Molecular Biology', 2025, NULL, NULL, 'university', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_19', 'uni_10', 'dthompson@uchicago.edu', '$2b$12$vkIlEnWyJzun4/5G9JJ8b.6bfaDXfOro/BE5XOet4rHjRog3xuoje', 'Daniel', 'Thompson', NULL, NULL, 'Economics', 2026, NULL, NULL, 'friends', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_2', 'uni_1', 'mjohnson@stanford.edu', '$2b$12$xaOMr2lkp0QRETIvq8u4cuPUZeGZm5wPG3yLVKeL.k50wnXuq0XHu', 'Maria', 'Johnson', NULL, NULL, 'Biology', 2024, NULL, NULL, 'university', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_20', 'uni_10', 'lwhite@uchicago.edu', '$2b$12$AYNfIS5e/XXpQMXyk45YrOyhE6h5m31dD5u1jNuWS7EDy2QoCelvK', 'Laura', 'White', NULL, NULL, 'Computer Science', 2024, NULL, NULL, 'university', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_21', 'uni_11', 'kharris@caltech.edu', '$2b$12$tPNSnlR5M1C4wblzZtkjHewED4hNZaFHamE26./KbENugBAZ/YTE.', 'Kevin', 'Harris', NULL, NULL, 'Aerospace Engineering', 2025, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_22', 'uni_11', 'nsanchez@caltech.edu', '$2b$12$99B1nCdRwbPXTk1hA/qF/u7Am8RR3E/TfA/muKLM.6fn3vrlBnGCK', 'Nicole', 'Sanchez', NULL, NULL, 'Physics', 2026, NULL, NULL, 'university', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_23', 'uni_12', 'jclark@cornell.edu', '$2b$12$bhZE432i93HKNuht5wzv5u3lxAxbUKgWG0fwW33OzQxa/TNmd0ZCi', 'Jason', 'Clark', NULL, NULL, 'Hotel Administration', 2024, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_24', 'uni_12', 'sramirez@cornell.edu', '$2b$12$t7WjqNiMLuXN8LORgsUUPePtl60BFLdA/1pvBTK/9Bhp1YZ6V.3MS', 'Stephanie', 'Ramirez', NULL, NULL, 'Agriculture', 2025, NULL, NULL, 'university', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_25', 'uni_13', 'rlewis@upenn.edu', '$2b$12$M23y1RsD0k90bFSi6OqGoOB1SAIuXBeZAstNyZytzVZK121OBeXDq', 'Richard', 'Lewis', NULL, NULL, 'Finance', 2026, NULL, NULL, 'friends', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_3', 'uni_2', 'dwilson@mit.edu', '$2b$12$6DFlGaxeQ1z5B.CgBSHC6epvoaL9j10mq3sirO2Ys/w7fg.4wLWtS', 'David', 'Wilson', NULL, NULL, 'Mechanical Engineering', 2026, NULL, NULL, 'friends', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_4', 'uni_2', 'slee@mit.edu', '$2b$12$F5R7LvlLLE0da0YxP9kOXORjxjrC13fBEoFykZx5tElc7vGz3AnqK', 'Sarah', 'Lee', NULL, NULL, 'Physics', 2025, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_5', 'uni_3', 'rbrooks@harvard.edu', '$2b$12$FDeJ3fS8.oWD5gQemrA26.WU3Kj1WJuwql3W/Eg7KPwHOLPz4eZay', 'Robert', 'Brooks', NULL, NULL, 'Economics', 2024, NULL, NULL, 'university', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_6', 'uni_3', 'lchen@harvard.edu', '$2b$12$iAq3kqetg1WxxSwMTNJjI.vNuDGW.n9fj91Z7baUnNt9ZoUMkvwgW', 'Lisa', 'Chen', NULL, NULL, 'Psychology', 2025, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_7', 'uni_4', 'mgarcia@berkeley.edu', '$2b$12$/uZoQWXq7MPCtMJ28ExYyOLlyw.Gp6gt05HNXPxgFOq9q2e9jHnKS', 'Michael', 'Garcia', NULL, NULL, 'Electrical Engineering', 2026, NULL, NULL, 'friends', 'university', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_8', 'uni_4', 'erodriguez@berkeley.edu', '$2b$12$QrizPadr.fMYXVso4hf.JuWWd1XchyUUV5P0IFpnIW5/V5iTCS1uy', 'Emily', 'Rodriguez', NULL, NULL, 'Political Science', 2024, NULL, NULL, 'university', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45'),
('user_9', 'uni_5', 'tmartinez@umich.edu', '$2b$12$hHvYFA8AJfQoi6XpAxlrl.2h6QbRL25/Q/5TTOBoGQzektLpzsXWG', 'Thomas', 'Martinez', NULL, NULL, 'Business', 2025, NULL, NULL, 'friends', 'friends', 1, 0, NULL, '2025-10-15 23:55:56', '2025-10-16 00:15:45');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `session_id` varchar(100) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `device_type` enum('ios','android','web') DEFAULT 'ios',
  `device_token` varchar(255) DEFAULT NULL,
  `fcm_token` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `last_active` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`session_id`, `user_id`, `device_type`, `device_token`, `fcm_token`, `ip_address`, `last_active`, `expires_at`, `is_active`, `created_at`) VALUES
('sess_1', 'user_1', 'ios', 'device_token_1', 'fcm_token_1', '192.168.1.100', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_10', 'user_10', 'web', 'device_token_10', 'fcm_token_10', '192.168.1.109', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_11', 'user_11', 'ios', 'device_token_11', 'fcm_token_11', '192.168.1.110', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_12', 'user_12', 'android', 'device_token_12', 'fcm_token_12', '192.168.1.111', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_13', 'user_13', 'ios', 'device_token_13', 'fcm_token_13', '192.168.1.112', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_14', 'user_14', 'android', 'device_token_14', 'fcm_token_14', '192.168.1.113', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_15', 'user_15', 'web', 'device_token_15', 'fcm_token_15', '192.168.1.114', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_16', 'user_16', 'ios', 'device_token_16', 'fcm_token_16', '192.168.1.115', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_17', 'user_17', 'android', 'device_token_17', 'fcm_token_17', '192.168.1.116', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_18', 'user_18', 'ios', 'device_token_18', 'fcm_token_18', '192.168.1.117', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_19', 'user_19', 'android', 'device_token_19', 'fcm_token_19', '192.168.1.118', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_2', 'user_2', 'android', 'device_token_2', 'fcm_token_2', '192.168.1.101', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_20', 'user_20', 'web', 'device_token_20', 'fcm_token_20', '192.168.1.119', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_21', 'user_21', 'ios', 'device_token_21', 'fcm_token_21', '192.168.1.120', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_22', 'user_22', 'android', 'device_token_22', 'fcm_token_22', '192.168.1.121', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_23', 'user_23', 'ios', 'device_token_23', 'fcm_token_23', '192.168.1.122', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_24', 'user_24', 'android', 'device_token_24', 'fcm_token_24', '192.168.1.123', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_25', 'user_25', 'web', 'device_token_25', 'fcm_token_25', '192.168.1.124', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_3', 'user_3', 'ios', 'device_token_3', 'fcm_token_3', '192.168.1.102', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_4', 'user_4', 'android', 'device_token_4', 'fcm_token_4', '192.168.1.103', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_5', 'user_5', 'web', 'device_token_5', 'fcm_token_5', '192.168.1.104', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_6', 'user_6', 'ios', 'device_token_6', 'fcm_token_6', '192.168.1.105', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_7', 'user_7', 'android', 'device_token_7', 'fcm_token_7', '192.168.1.106', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_8', 'user_8', 'ios', 'device_token_8', 'fcm_token_8', '192.168.1.107', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56'),
('sess_9', 'user_9', 'android', 'device_token_9', 'fcm_token_9', '192.168.1.108', '2025-10-15 23:55:56', '2024-12-31 23:59:59', 1, '2025-10-15 23:55:56');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_user_action` (`user_id`,`action_type`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_action_type` (`action_type`);

--
-- Indexes for table `campus_buildings`
--
ALTER TABLE `campus_buildings`
  ADD PRIMARY KEY (`building_id`),
  ADD UNIQUE KEY `unique_building_code` (`university_id`,`building_code`),
  ADD KEY `idx_university_id` (`university_id`),
  ADD KEY `idx_building_type` (`building_type`);

--
-- Indexes for table `campus_facilities`
--
ALTER TABLE `campus_facilities`
  ADD PRIMARY KEY (`facility_id`),
  ADD KEY `idx_building_id` (`building_id`),
  ADD KEY `idx_facility_type` (`facility_type`);

--
-- Indexes for table `connections`
--
ALTER TABLE `connections`
  ADD PRIMARY KEY (`connection_id`),
  ADD UNIQUE KEY `unique_connection` (`requester_id`,`receiver_id`),
  ADD KEY `idx_requester_status` (`requester_id`,`status`),
  ADD KEY `idx_receiver_status` (`receiver_id`,`status`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `idx_university_time` (`university_id`,`start_time`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `event_attendees`
--
ALTER TABLE `event_attendees`
  ADD PRIMARY KEY (`attendee_id`),
  ADD UNIQUE KEY `unique_event_attendee` (`event_id`,`user_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_event_status` (`event_id`,`rsvp_status`);

--
-- Indexes for table `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`group_member_id`),
  ADD UNIQUE KEY `unique_group_member` (`group_id`,`user_id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `otps`
--
ALTER TABLE `otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indexes for table `study_groups`
--
ALTER TABLE `study_groups`
  ADD PRIMARY KEY (`group_id`),
  ADD KEY `idx_university_course` (`university_id`,`course_code`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `universities`
--
ALTER TABLE `universities`
  ADD PRIMARY KEY (`university_id`),
  ADD UNIQUE KEY `domain` (`domain`);

--
-- Indexes for table `university_departments`
--
ALTER TABLE `university_departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `unique_department_code` (`university_id`,`department_code`),
  ADD KEY `idx_university_id` (`university_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_university_id` (`university_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `log_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `otps`
--
ALTER TABLE `otps`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `campus_buildings`
--
ALTER TABLE `campus_buildings`
  ADD CONSTRAINT `campus_buildings_ibfk_1` FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`) ON DELETE CASCADE;

--
-- Constraints for table `campus_facilities`
--
ALTER TABLE `campus_facilities`
  ADD CONSTRAINT `campus_facilities_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `campus_buildings` (`building_id`) ON DELETE CASCADE;

--
-- Constraints for table `connections`
--
ALTER TABLE `connections`
  ADD CONSTRAINT `connections_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `connections_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `events_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_attendees`
--
ALTER TABLE `event_attendees`
  ADD CONSTRAINT `event_attendees_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_attendees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `group_members`
--
ALTER TABLE `group_members`
  ADD CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `study_groups` (`group_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `study_groups`
--
ALTER TABLE `study_groups`
  ADD CONSTRAINT `study_groups_ibfk_1` FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `study_groups_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `university_departments`
--
ALTER TABLE `university_departments`
  ADD CONSTRAINT `university_departments_ibfk_1` FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`university_id`) REFERENCES `universities` (`university_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
