-- Active duty roster for rotating pickup staff.
-- School admins assign scanner and release guards per day without creating new accounts.

CREATE TABLE IF NOT EXISTS `guard_duty_roster` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_id` int(11) NOT NULL,
  `guard_id` int(11) NOT NULL,
  `duty_date` date NOT NULL,
  `duty_role` enum('scanner','release','both') NOT NULL DEFAULT 'release',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_guard_duty_day` (`school_id`, `guard_id`, `duty_date`),
  KEY `idx_guard_duty_school_date` (`school_id`, `duty_date`, `is_active`),
  KEY `idx_guard_duty_guard_date` (`guard_id`, `duty_date`, `is_active`),
  KEY `idx_guard_duty_role` (`duty_role`),
  CONSTRAINT `fk_guard_duty_school`
    FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_guard_duty_guard`
    FOREIGN KEY (`guard_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_guard_duty_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
