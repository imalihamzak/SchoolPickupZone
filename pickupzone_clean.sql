-- Pickup Zone clean localhost import
-- Generated for the current project schema.
-- This file intentionally removes broken/demo data from the phpMyAdmin dump.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `pickupzone`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE `pickupzone`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `pickup_logs`;
DROP TABLE IF EXISTS `pickup_security_events`;
DROP TABLE IF EXISTS `qr_assignments`;
DROP TABLE IF EXISTS `qr_codes`;
DROP TABLE IF EXISTS `guardian_vehicles`;
DROP TABLE IF EXISTS `vehicles`;
DROP TABLE IF EXISTS `guard_devices`;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `children`;
DROP TABLE IF EXISTS `guardians`;
DROP TABLE IF EXISTS `families`;
DROP TABLE IF EXISTS `email_change_verifications`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `billing_reminders`;
DROP TABLE IF EXISTS `stripe_invoice_retries`;
DROP TABLE IF EXISTS `stripe_webhook_events`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `subscription_change_logs`;
DROP TABLE IF EXISTS `school_onboarding_acceptances`;
DROP TABLE IF EXISTS `subscriptions`;
DROP TABLE IF EXISTS `contact_inquiries`;
DROP TABLE IF EXISTS `super_admin_audit_logs`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `subscription_plans`;
DROP TABLE IF EXISTS `schools`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `schools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `student_count` int(11) NOT NULL DEFAULT 0,
  `status` enum('Active','Suspended') NOT NULL DEFAULT 'Active',
  `suspension_reason` text DEFAULT NULL,
  `suspended_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_schools_status` (`status`),
  KEY `idx_schools_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
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
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subscription_plans_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` enum('parent','guard','admin','super-admin') DEFAULT NULL,
  `firstName` varchar(50) DEFAULT NULL,
  `lastName` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `childName` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) DEFAULT 'inactive',
  `profile_picture` varchar(255) DEFAULT NULL,
  `school_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_school_role` (`school_id`,`role`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_password_reset_token` (`token`),
  KEY `idx_password_resets_email` (`email`),
  KEY `idx_password_resets_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `email_change_verifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `new_email` varchar(100) NOT NULL,
  `code_hash` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_email_change_user` (`user_id`),
  KEY `idx_email_change_email` (`new_email`),
  KEY `idx_email_change_expires` (`expires_at`),
  CONSTRAINT `fk_email_change_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `families` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `family_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_family_user` (`user_id`),
  CONSTRAINT `fk_families_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `children` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `medical_info` text DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_children_user` (`user_id`),
  CONSTRAINT `fk_children_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `guardians` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_guardians_user` (`user_id`),
  KEY `idx_guardians_status` (`status`),
  CONSTRAINT `fk_guardians_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guardian_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `make` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `plate_number` varchar(50) DEFAULT NULL,
  `year` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vehicles_guardian` (`guardian_id`),
  KEY `idx_vehicles_user` (`user_id`),
  CONSTRAINT `fk_vehicles_guardian`
    FOREIGN KEY (`guardian_id`) REFERENCES `guardians` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_vehicles_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `guardian_vehicles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guardian_id` int(11) NOT NULL,
  `year` varchar(10) DEFAULT NULL,
  `make` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `plate_number` varchar(50) DEFAULT NULL,
  `vehicle_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_guardian_vehicles_guardian` (`guardian_id`),
  CONSTRAINT `fk_guardian_vehicles_guardian`
    FOREIGN KEY (`guardian_id`) REFERENCES `guardians` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `child_id` int(11) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `required` tinyint(1) DEFAULT 0,
  `status` varchar(50) DEFAULT 'Pending',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `rejection_reason` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_documents_user` (`user_id`),
  KEY `idx_documents_child` (`child_id`),
  KEY `idx_documents_status` (`status`),
  CONSTRAINT `fk_documents_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_child`
    FOREIGN KEY (`child_id`) REFERENCES `children` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `guard_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guard_id` int(11) NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `device_fingerprint` varchar(255) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `registered_ip_address` varchar(64) DEFAULT NULL,
  `allowed_ip_address` varchar(64) DEFAULT NULL,
  `last_scan_ip` varchar(64) DEFAULT NULL,
  `last_scan_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_guard_device` (`guard_id`,`device_fingerprint`),
  KEY `idx_guard_devices_active` (`guard_id`,`is_active`),
  CONSTRAINT `fk_guard_devices_guard`
    FOREIGN KEY (`guard_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('profile_request','message','qr_scan','unauthorized','invalid_qr','pickup_success','payment_reminder','payment_failed','billing_retry') DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  `read` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_time` (`user_id`,`timestamp`),
  KEY `idx_notifications_read` (`user_id`,`read`),
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_school` (`school_id`),
  KEY `idx_subscriptions_plan` (`plan_id`),
  KEY `idx_subscriptions_status` (`status`),
  KEY `idx_subscriptions_stripe_subscription` (`stripe_subscription_id`),
  KEY `idx_subscriptions_pending_change` (`pending_change_effective_at`),
  KEY `idx_subscriptions_grace_end` (`grace_period_ends_at`),
  CONSTRAINT `fk_subscriptions_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_subscriptions_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_subscriptions_pending_plan`
    FOREIGN KEY (`pending_plan_id`) REFERENCES `subscription_plans` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `school_onboarding_acceptances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_interval` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
  `terms_version` varchar(50) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `accepted_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_school_onboarding_school` (`school_id`),
  KEY `idx_school_onboarding_user` (`user_id`),
  KEY `idx_school_onboarding_plan` (`plan_id`),
  CONSTRAINT `fk_school_onboarding_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_school_onboarding_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_school_onboarding_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `failure_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payments_school` (`school_id`),
  KEY `idx_payments_plan` (`plan_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_stripe_invoice` (`stripe_invoice_id`),
  KEY `idx_payments_billing_reason` (`billing_reason`),
  KEY `idx_payments_stripe_event` (`stripe_event_id`),
  KEY `idx_payments_invoice_number` (`invoice_number`),
  KEY `idx_payments_invoice_due_date` (`invoice_due_date`),
  CONSTRAINT `fk_payments_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `subscription_change_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subscription_change_logs_subscription` (`subscription_id`),
  KEY `idx_subscription_change_logs_school` (`school_id`),
  KEY `idx_subscription_change_logs_type` (`change_type`),
  KEY `idx_subscription_change_logs_effective` (`effective_at`),
  CONSTRAINT `fk_subscription_change_subscription`
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_subscription_change_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_subscription_change_from_plan`
    FOREIGN KEY (`from_plan_id`) REFERENCES `subscription_plans` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_subscription_change_to_plan`
    FOREIGN KEY (`to_plan_id`) REFERENCES `subscription_plans` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_subscription_change_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `billing_reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_billing_reminder_event` (`stripe_event_id`,`reminder_type`),
  KEY `idx_billing_reminders_school` (`school_id`),
  KEY `idx_billing_reminders_invoice` (`stripe_invoice_id`),
  KEY `idx_billing_reminders_type` (`reminder_type`),
  KEY `idx_billing_reminders_due` (`due_at`),
  CONSTRAINT `fk_billing_reminders_subscription`
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_billing_reminders_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_billing_reminders_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `stripe_invoice_retries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stripe_invoice_retry_attempt` (`stripe_invoice_id`,`attempt_number`),
  KEY `idx_stripe_invoice_retries_due` (`status`,`scheduled_at`),
  KEY `idx_stripe_invoice_retries_subscription` (`subscription_id`),
  KEY `idx_stripe_invoice_retries_school` (`school_id`),
  CONSTRAINT `fk_stripe_invoice_retries_subscription`
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_stripe_invoice_retries_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_stripe_invoice_retries_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `stripe_webhook_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stripe_event_id` varchar(255) NOT NULL,
  `event_type` varchar(150) NOT NULL,
  `object_id` varchar(255) DEFAULT NULL,
  `processing_status` enum('processing','processed','failed','ignored') NOT NULL DEFAULT 'processing',
  `retry_count` int(11) NOT NULL DEFAULT 0,
  `error_message` text DEFAULT NULL,
  `received_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stripe_webhook_event` (`stripe_event_id`),
  KEY `idx_stripe_webhook_events_type` (`event_type`),
  KEY `idx_stripe_webhook_events_status` (`processing_status`),
  KEY `idx_stripe_webhook_events_received` (`received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `qr_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_qr_assignments_user` (`user_id`),
  KEY `idx_qr_assignments_child` (`child_id`),
  KEY `idx_qr_assignments_guardian` (`guardian_id`),
  KEY `idx_qr_assignments_school` (`school_id`),
  KEY `idx_qr_assignments_token_hash` (`token_hash`),
  KEY `idx_qr_assignments_status` (`status`),
  KEY `idx_qr_assignments_school_status` (`school_id`,`status`),
  KEY `idx_qr_assignments_token_version` (`token_version`),
  CONSTRAINT `fk_qr_assignments_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_qr_assignments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_qr_assignments_guardian`
    FOREIGN KEY (`guardian_id`) REFERENCES `guardians` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_qr_assignments_child`
    FOREIGN KEY (`child_id`) REFERENCES `children` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_qr_assignments_revoked_by`
    FOREIGN KEY (`revoked_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `qr_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `code` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `default_guardian_id` int(11) DEFAULT NULL,
  `default_vehicle` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_qr_codes_user` (`user_id`),
  KEY `idx_qr_codes_guardian` (`default_guardian_id`),
  CONSTRAINT `fk_qr_codes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_qr_codes_guardian`
    FOREIGN KEY (`default_guardian_id`) REFERENCES `guardians` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `pickup_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) DEFAULT NULL,
  `qr_assignment_id` int(11) DEFAULT NULL,
  `child_id` int(11) DEFAULT NULL,
  `guardian_id` int(11) DEFAULT NULL,
  `guard_id` int(11) DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
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
  `vehicle_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pickup_logs_qr_assignment` (`qr_assignment_id`),
  KEY `idx_pickup_logs_guard` (`guard_id`),
  KEY `idx_pickup_logs_device` (`device_id`),
  KEY `idx_pickup_logs_vehicle` (`vehicle_id`),
  KEY `idx_pickup_logs_school_status` (`school_id`,`status`),
  KEY `idx_pickup_logs_school_scanned` (`school_id`,`scanned_at`),
  KEY `idx_pickup_logs_child` (`child_id`),
  KEY `idx_pickup_logs_guardian` (`guardian_id`),
  KEY `idx_pickup_logs_status` (`status`),
  CONSTRAINT `fk_pickup_logs_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_qr_assignment`
    FOREIGN KEY (`qr_assignment_id`) REFERENCES `qr_assignments` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_child`
    FOREIGN KEY (`child_id`) REFERENCES `children` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_guardian`
    FOREIGN KEY (`guardian_id`) REFERENCES `guardians` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_guard`
    FOREIGN KEY (`guard_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_device`
    FOREIGN KEY (`device_id`) REFERENCES `guard_devices` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_approved_by`
    FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_rejected_by`
    FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_confirmed_by`
    FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_logs_vehicle`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `pickup_security_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) DEFAULT NULL,
  `guard_id` int(11) DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
  `event_type` enum('invalid_qr','unauthorized_device','tenant_mismatch','revoked_qr','expired_qr','feature_blocked') NOT NULL,
  `qr_token_hash` varchar(128) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pickup_security_school` (`school_id`),
  KEY `idx_pickup_security_guard` (`guard_id`),
  KEY `idx_pickup_security_device` (`device_id`),
  KEY `idx_pickup_security_type` (`event_type`),
  KEY `idx_pickup_security_created` (`created_at`),
  CONSTRAINT `fk_pickup_security_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_security_guard`
    FOREIGN KEY (`guard_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pickup_security_device`
    FOREIGN KEY (`device_id`) REFERENCES `guard_devices` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `contact_inquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_contact_inquiries_status` (`status`),
  KEY `idx_contact_inquiries_school` (`school_id`),
  KEY `idx_contact_inquiries_user` (`user_id`),
  KEY `idx_contact_inquiries_created` (`created_at`),
  CONSTRAINT `fk_contact_inquiries_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_contact_inquiries_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `super_admin_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `actor_id` int(11) DEFAULT NULL,
  `actor_role` varchar(50) DEFAULT NULL,
  `actor_email` varchar(255) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(60) NOT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `entity_name` varchar(255) DEFAULT NULL,
  `status` enum('success','failed') NOT NULL DEFAULT 'success',
  `request_method` varchar(10) DEFAULT NULL,
  `request_path` varchar(500) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `metadata` longtext DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_super_admin_audit_actor` (`actor_id`),
  KEY `idx_super_admin_audit_action` (`action`),
  KEY `idx_super_admin_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_super_admin_audit_status` (`status`),
  KEY `idx_super_admin_audit_created` (`created_at`),
  CONSTRAINT `fk_super_admin_audit_actor`
    FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `subscription_plans`
  (`id`, `name`, `price`, `monthly_price`, `yearly_price`, `max_students`, `max_families`, `max_guards`, `storage_limit_mb`, `grace_period_days`, `billing_interval`, `features`, `feature_toggles`, `is_active`)
VALUES
  (
    1,
    'Basic',
    20.00,
    20.00,
    200.00,
    120,
    100,
    5,
    500,
    7,
    'monthly',
    'Core QR verification, guardian management, pickup logs, notifications, and device authorization.',
    '{"qr_verification":true,"guardian_management":true,"pickup_logs":true,"analytics":false,"document_uploads":false,"notifications":true,"device_authorization":true}',
    1
  ),
  (
    2,
    'Popular',
    30.00,
    30.00,
    320.00,
    NULL,
    NULL,
    NULL,
    NULL,
    7,
    'monthly',
    'All Pickup Zone features with unlimited operational limits.',
    '{"qr_verification":true,"guardian_management":true,"pickup_logs":true,"analytics":true,"document_uploads":true,"notifications":true,"device_authorization":true}',
    1
  ),
  (
    3,
    'Premium',
    399.00,
    399.00,
    3990.00,
    NULL,
    NULL,
    NULL,
    NULL,
    7,
    'monthly',
    'Enterprise package for large schools and districts.',
    '{"qr_verification":true,"guardian_management":true,"pickup_logs":true,"analytics":true,"document_uploads":true,"notifications":true,"device_authorization":true}',
    1
  );

INSERT INTO `users`
  (`id`, `role`, `firstName`, `lastName`, `email`, `phone`, `password`, `childName`, `status`, `profile_picture`, `school_id`)
VALUES
  (
    1,
    'super-admin',
    'Super',
    'Admin',
    'superadmin@gmail.com',
    NULL,
    '$2b$10$s1TmMBE92Y61TC2aEPdES.BUH1IOVlSEbpBa0UnlKUSCiTleQ4oxe',
    NULL,
    'active',
    NULL,
    NULL
  );

ALTER TABLE `subscription_plans` AUTO_INCREMENT = 4;
ALTER TABLE `users` AUTO_INCREMENT = 2;

COMMIT;
