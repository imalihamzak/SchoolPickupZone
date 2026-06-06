-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 09, 2026 at 11:35 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pickupzone`
--

-- --------------------------------------------------------

--
-- Table structure for table `billing_reminders`
--

CREATE TABLE `billing_reminders` (
  `id` int(11) NOT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `school_id` int(11) NOT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `stripe_invoice_id` varchar(255) DEFAULT NULL,
  `stripe_event_id` varchar(255) DEFAULT NULL,
  `reminder_type` enum('upcoming_invoice','payment_failed','retry_scheduled','retry_failed','retry_succeeded') NOT NULL,
  `amount_due` decimal(10,2) NOT NULL DEFAULT 0.00,
  `due_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `status` enum('sent','failed') NOT NULL DEFAULT 'sent',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `children`
--

CREATE TABLE `children` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `medical_info` text DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_inquiries`
--

CREATE TABLE `contact_inquiries` (
  `id` int(11) NOT NULL,
  `school_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(140) NOT NULL,
  `email` varchar(180) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `subject` varchar(180) DEFAULT NULL,
  `message` text NOT NULL,
  `source` varchar(80) DEFAULT NULL,
  `status` enum('New','In Progress','Closed') NOT NULL DEFAULT 'New',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `child_id` int(11) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `required` tinyint(1) DEFAULT 0,
  `status` varchar(50) DEFAULT 'Pending',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `rejection_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_change_verifications`
--

CREATE TABLE `email_change_verifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `new_email` varchar(100) NOT NULL,
  `code_hash` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `families`
--

CREATE TABLE `families` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `family_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guardians`
--

CREATE TABLE `guardians` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guard_devices`
--

CREATE TABLE `guard_devices` (
  `id` int(11) NOT NULL,
  `guard_id` int(11) NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `device_fingerprint` varchar(255) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `registered_ip_address` varchar(64) DEFAULT NULL,
  `allowed_ip_address` varchar(64) DEFAULT NULL,
  `last_scan_ip` varchar(64) DEFAULT NULL,
  `last_scan_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('profile_request','message','qr_scan','unauthorized','invalid_qr','pickup_success','payment_reminder','payment_failed','billing_retry') DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  `read` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('Credit Card','PayPal','Bank Transfer') DEFAULT NULL,
  `status` enum('Successful','Failed','Pending') DEFAULT 'Pending',
  `payment_date` date DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `stripe_invoice_id` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `stripe_event_id` varchar(255) DEFAULT NULL,
  `stripe_charge_id` varchar(255) DEFAULT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_due_date` datetime DEFAULT NULL,
  `invoice_hosted_url` varchar(500) DEFAULT NULL,
  `invoice_pdf_url` varchar(500) DEFAULT NULL,
  `attempt_count` int(11) DEFAULT NULL,
  `billing_reason` enum('subscription_create','subscription_cycle','upgrade_proration','manual','failed_retry') DEFAULT 'manual',
  `failure_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pickup_logs`
--

CREATE TABLE `pickup_logs` (
  `id` int(11) NOT NULL,
  `school_id` int(11) DEFAULT NULL,
  `qr_assignment_id` int(11) NOT NULL,
  `child_id` int(11) DEFAULT NULL,
  `guardian_id` int(11) DEFAULT NULL,
  `guard_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `scanned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `confirmed` tinyint(1) DEFAULT 0,
  `status` enum('pending','approved','rejected','confirmed','invalid','unauthorized') NOT NULL DEFAULT 'pending',
  `approval_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejected_by` int(11) DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `confirmed_by` int(11) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `scan_ip` varchar(64) DEFAULT NULL,
  `scan_user_agent` text DEFAULT NULL,
  `invalid_reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `vehicle_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pickup_security_events`
--

CREATE TABLE `pickup_security_events` (
  `id` int(11) NOT NULL,
  `school_id` int(11) DEFAULT NULL,
  `guard_id` int(11) DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
  `event_type` enum('invalid_qr','unauthorized_device','tenant_mismatch','revoked_qr','expired_qr','feature_blocked') NOT NULL,
  `qr_token_hash` varchar(128) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `qr_assignments`
--

CREATE TABLE `qr_assignments` (
  `id` int(11) NOT NULL,
  `school_id` int(11) DEFAULT NULL,
  `token_id` varchar(64) DEFAULT NULL,
  `token_version` int(11) NOT NULL DEFAULT 1,
  `token_hash` varchar(128) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `guardian_id` int(11) DEFAULT NULL,
  `child_id` int(11) NOT NULL,
  `qr_code` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `status` enum('Active','Revoked') NOT NULL DEFAULT 'Active',
  `revoked_at` datetime DEFAULT NULL,
  `revoked_by` int(11) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `last_rotated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schools`
--

CREATE TABLE `schools` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `student_count` int(11) DEFAULT 0,
  `status` enum('Active','Suspended') NOT NULL DEFAULT 'Active',
  `suspension_reason` text DEFAULT NULL,
  `suspended_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schools`
--

INSERT INTO `schools` (`id`, `name`, `location`, `student_count`, `status`, `suspension_reason`, `suspended_at`, `created_at`) VALUES
(0, 'Echison School', 'islamabad', 2000, 'Suspended', 'Subscription grace period expired.', '2026-05-09 12:00:10', '2026-05-09 06:55:56');

-- --------------------------------------------------------

--
-- Table structure for table `school_onboarding_acceptances`
--

CREATE TABLE `school_onboarding_acceptances` (
  `id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_interval` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
  `terms_version` varchar(50) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `accepted_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stripe_invoice_retries`
--

CREATE TABLE `stripe_invoice_retries` (
  `id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `stripe_invoice_id` varchar(255) NOT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `stripe_event_id` varchar(255) DEFAULT NULL,
  `attempt_number` int(11) NOT NULL,
  `amount_due` decimal(10,2) NOT NULL DEFAULT 0.00,
  `scheduled_at` datetime NOT NULL,
  `processed_at` datetime DEFAULT NULL,
  `status` enum('scheduled','processing','succeeded','failed','cancelled') NOT NULL DEFAULT 'scheduled',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stripe_webhook_events`
--

CREATE TABLE `stripe_webhook_events` (
  `id` int(11) NOT NULL,
  `stripe_event_id` varchar(255) NOT NULL,
  `event_type` varchar(150) NOT NULL,
  `object_id` varchar(255) DEFAULT NULL,
  `processing_status` enum('processing','processed','failed','ignored') NOT NULL DEFAULT 'processing',
  `retry_count` int(11) NOT NULL DEFAULT 0,
  `error_message` text DEFAULT NULL,
  `received_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_interval` enum('monthly','yearly') DEFAULT 'monthly',
  `status` enum('Active','Expiring Soon','Inactive','Cancelled') DEFAULT 'Inactive',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `next_billing_date` date DEFAULT NULL,
  `last_payment_amount` decimal(10,2) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `stripe_status` varchar(100) DEFAULT NULL,
  `latest_invoice_id` varchar(255) DEFAULT NULL,
  `failed_payment_count` int(11) NOT NULL DEFAULT 0,
  `last_payment_failed_at` datetime DEFAULT NULL,
  `grace_period_ends_at` datetime DEFAULT NULL,
  `cancel_at_period_end` tinyint(1) NOT NULL DEFAULT 0,
  `cancelled_at` datetime DEFAULT NULL,
  `pending_plan_id` int(11) DEFAULT NULL,
  `pending_billing_interval` enum('monthly','yearly') DEFAULT NULL,
  `pending_change_type` enum('upgrade','downgrade') DEFAULT NULL,
  `pending_change_effective_at` datetime DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `school_id`, `plan_id`, `billing_interval`, `status`, `start_date`, `end_date`, `next_billing_date`, `last_payment_amount`, `stripe_subscription_id`, `stripe_customer_id`, `stripe_status`, `latest_invoice_id`, `failed_payment_count`, `last_payment_failed_at`, `grace_period_ends_at`, `cancel_at_period_end`, `cancelled_at`, `pending_plan_id`, `pending_billing_interval`, `pending_change_type`, `pending_change_effective_at`, `updated_at`) VALUES
(1, 19, 4, 'monthly', 'Inactive', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, '2026-05-16 14:32:37', 0, NULL, NULL, NULL, NULL, NULL, '2026-05-09 09:32:37'),
(2, 0, 4, 'monthly', 'Inactive', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, '2026-05-08 13:18:39', 0, NULL, NULL, NULL, NULL, NULL, '2026-05-09 07:12:20'),
(3, 0, 4, 'monthly', 'Inactive', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, '2026-05-08 13:18:39', 0, NULL, NULL, NULL, NULL, NULL, '2026-05-09 07:12:20');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_change_logs`
--

CREATE TABLE `subscription_change_logs` (
  `id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `school_id` int(11) NOT NULL,
  `from_plan_id` int(11) DEFAULT NULL,
  `to_plan_id` int(11) DEFAULT NULL,
  `from_billing_interval` enum('monthly','yearly') DEFAULT NULL,
  `to_billing_interval` enum('monthly','yearly') DEFAULT NULL,
  `change_type` enum('upgrade','downgrade','cancel','reactivate','renewal','payment_failed','auto_suspend','plan_change') NOT NULL,
  `effective_at` datetime DEFAULT NULL,
  `proration_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `monthly_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `yearly_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_students` int(11) DEFAULT NULL,
  `max_families` int(11) DEFAULT NULL,
  `max_guards` int(11) DEFAULT NULL,
  `storage_limit_mb` int(11) DEFAULT NULL,
  `grace_period_days` int(11) NOT NULL DEFAULT 7,
  `billing_interval` enum('monthly','yearly') DEFAULT 'monthly',
  `features` text DEFAULT NULL,
  `feature_toggles` longtext DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `price`, `monthly_price`, `yearly_price`, `max_students`, `max_families`, `max_guards`, `storage_limit_mb`, `grace_period_days`, `billing_interval`, `features`, `feature_toggles`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 'Basic', 20.00, 20.00, 200.00, 120, 100, 100, NULL, 7, 'monthly', 'Daily report', '{\"qr_verification\":false,\"guardian_management\":true,\"pickup_logs\":false,\"analytics\":false,\"document_uploads\":true,\"notifications\":true,\"device_authorization\":true}', 1, '2026-05-01 08:26:47', '2026-05-02 16:43:59'),
(4, 'Popular', 30.00, 30.00, 320.00, NULL, NULL, NULL, NULL, 7, 'monthly', '', '{\"qr_verification\":true,\"guardian_management\":true,\"pickup_logs\":true,\"analytics\":true,\"document_uploads\":true,\"notifications\":true,\"device_authorization\":true}', 1, '2026-05-01 08:28:51', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role` enum('parent','guard','admin','super-admin') DEFAULT NULL,
  `firstName` varchar(50) DEFAULT NULL,
  `lastName` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `childName` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) DEFAULT 'inActive',
  `profile_picture` varchar(255) DEFAULT NULL,
  `school_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role`, `firstName`, `lastName`, `email`, `phone`, `password`, `childName`, `created_at`, `status`, `profile_picture`, `school_id`) VALUES
(76, 'super-admin', 'Super', 'Admin', 'superadmin@gmail.com', NULL, '$2b$10$s1TmMBE92Y61TC2aEPdES.BUH1IOVlSEbpBa0UnlKUSCiTleQ4oxe', NULL, '2026-05-08 08:17:28', 'active', NULL, NULL),
(77, 'admin', 'Ali', 'Hamza', 'alishahzad82313@gmail.com', '+923002634794', '$2b$10$J2rgkm4BOCalwehVyr3Jv.VeK2.gyglWVvZWKy3/Q1mWanz6pnWCi', NULL, '2026-05-01 08:18:39', 'active', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `guardian_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `make` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `plate_number` varchar(50) DEFAULT NULL,
  `year` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `billing_reminders`
--
ALTER TABLE `billing_reminders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_billing_reminder_event` (`stripe_event_id`,`reminder_type`),
  ADD KEY `idx_billing_reminders_school` (`school_id`),
  ADD KEY `idx_billing_reminders_invoice` (`stripe_invoice_id`),
  ADD KEY `idx_billing_reminders_type` (`reminder_type`),
  ADD KEY `idx_billing_reminders_due` (`due_at`);

--
-- Indexes for table `children`
--
ALTER TABLE `children`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `contact_inquiries`
--
ALTER TABLE `contact_inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_inquiries_status` (`status`),
  ADD KEY `idx_contact_inquiries_school` (`school_id`),
  ADD KEY `idx_contact_inquiries_created` (`created_at`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `child_id` (`child_id`);

--
-- Indexes for table `email_change_verifications`
--
ALTER TABLE `email_change_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_change_user` (`user_id`),
  ADD KEY `idx_email_change_email` (`new_email`),
  ADD KEY `idx_email_change_expires` (`expires_at`);

--
-- Indexes for table `families`
--
ALTER TABLE `families`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `guardians`
--
ALTER TABLE `guardians`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `guard_devices`
--
ALTER TABLE `guard_devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_guard_device` (`guard_id`,`device_fingerprint`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `school_id` (`school_id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `idx_payments_stripe_invoice` (`stripe_invoice_id`),
  ADD KEY `idx_payments_billing_reason` (`billing_reason`),
  ADD KEY `idx_payments_stripe_event` (`stripe_event_id`),
  ADD KEY `idx_payments_invoice_number` (`invoice_number`),
  ADD KEY `idx_payments_invoice_due_date` (`invoice_due_date`);

--
-- Indexes for table `pickup_logs`
--
ALTER TABLE `pickup_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `qr_assignment_id` (`qr_assignment_id`),
  ADD KEY `guard_id` (`guard_id`),
  ADD KEY `device_id` (`device_id`),
  ADD KEY `fk_pickup_vehicle` (`vehicle_id`),
  ADD KEY `idx_pickup_logs_school_status` (`school_id`,`status`),
  ADD KEY `idx_pickup_logs_school_scanned` (`school_id`,`scanned_at`),
  ADD KEY `idx_pickup_logs_child` (`child_id`),
  ADD KEY `idx_pickup_logs_guardian` (`guardian_id`),
  ADD KEY `idx_pickup_logs_status` (`status`);

--
-- Indexes for table `pickup_security_events`
--
ALTER TABLE `pickup_security_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pickup_security_school` (`school_id`),
  ADD KEY `idx_pickup_security_guard` (`guard_id`),
  ADD KEY `idx_pickup_security_type` (`event_type`),
  ADD KEY `idx_pickup_security_created` (`created_at`);

--
-- Indexes for table `qr_assignments`
--
ALTER TABLE `qr_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `child_id` (`child_id`),
  ADD KEY `guardian_id` (`guardian_id`),
  ADD KEY `idx_qr_assignments_school` (`school_id`),
  ADD KEY `idx_qr_assignments_token_hash` (`token_hash`),
  ADD KEY `idx_qr_assignments_status` (`status`),
  ADD KEY `idx_qr_assignments_school_status` (`school_id`,`status`),
  ADD KEY `idx_qr_assignments_token_version` (`token_version`);

--
-- Indexes for table `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscription_change_logs`
--
ALTER TABLE `subscription_change_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `subscription_change_logs`
--
ALTER TABLE `subscription_change_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
