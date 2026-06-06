-- Adds payment reminder tracking and application-controlled Stripe retry schedules.

ALTER TABLE `notifications`
  MODIFY `type` enum(
    'profile_request',
    'message',
    'qr_scan',
    'unauthorized',
    'invalid_qr',
    'pickup_success',
    'payment_reminder',
    'payment_failed',
    'billing_retry'
  ) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `billing_reminders` (
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
  KEY `idx_billing_reminders_due` (`due_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `stripe_invoice_retries` (
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
  KEY `idx_stripe_invoice_retries_school` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
