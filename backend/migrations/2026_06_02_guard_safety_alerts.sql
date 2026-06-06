-- Adds guard safety alert notifications and an audit table for emergency pickup-line alerts.

ALTER TABLE `notifications`
  MODIFY `type` enum(
    'profile_request',
    'message',
    'qr_scan',
    'document_review',
    'safety_alert',
    'parent_message',
    'unauthorized',
    'invalid_qr',
    'pickup_success',
    'payment_reminder',
    'payment_failed',
    'billing_retry'
  ) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `guard_safety_alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) NOT NULL,
  `pickup_log_id` int(11) DEFAULT NULL,
  `reporting_guard_id` int(11) NOT NULL,
  `alert_type` varchar(64) NOT NULL,
  `message` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `target_guard_ids` varchar(255) DEFAULT NULL,
  `guard_notified_count` int(11) NOT NULL DEFAULT 0,
  `admin_notified` tinyint(1) NOT NULL DEFAULT 0,
  `delivery_status` varchar(32) NOT NULL DEFAULT 'pending',
  `delivery_error` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_guard_safety_school_created` (`school_id`, `created_at`),
  KEY `idx_guard_safety_guard_created` (`reporting_guard_id`, `created_at`),
  KEY `idx_guard_safety_pickup` (`pickup_log_id`),
  CONSTRAINT `fk_guard_safety_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_guard_safety_pickup`
    FOREIGN KEY (`pickup_log_id`) REFERENCES `pickup_logs` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_guard_safety_guard`
    FOREIGN KEY (`reporting_guard_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
