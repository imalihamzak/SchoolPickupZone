-- Parent-to-duty-guard pickup messages for running late, car line issues, and assistance notes.

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

CREATE TABLE IF NOT EXISTS `parent_guard_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `pickup_log_id` int(11) DEFAULT NULL,
  `message_type` varchar(40) NOT NULL,
  `message` text DEFAULT NULL,
  `children_summary` varchar(500) DEFAULT NULL,
  `vehicle_summary` varchar(255) DEFAULT NULL,
  `target_guard_ids` text DEFAULT NULL,
  `guard_notified_count` int(11) NOT NULL DEFAULT 0,
  `admin_notified` tinyint(1) NOT NULL DEFAULT 0,
  `delivery_status` varchar(32) NOT NULL DEFAULT 'pending',
  `delivery_error` varchar(255) DEFAULT NULL,
  `acknowledged_by` int(11) DEFAULT NULL,
  `acknowledged_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_parent_guard_messages_school_created` (`school_id`, `created_at`),
  KEY `idx_parent_guard_messages_parent_created` (`parent_id`, `created_at`),
  KEY `idx_parent_guard_messages_pickup` (`pickup_log_id`),
  KEY `idx_parent_guard_messages_ack` (`acknowledged_by`, `acknowledged_at`),
  CONSTRAINT `fk_parent_guard_messages_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_parent_guard_messages_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_parent_guard_messages_pickup`
    FOREIGN KEY (`pickup_log_id`) REFERENCES `pickup_logs` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_parent_guard_messages_ack_guard`
    FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
