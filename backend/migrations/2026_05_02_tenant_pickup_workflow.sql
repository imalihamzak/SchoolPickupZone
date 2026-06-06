-- Tenant-isolated pickup workflow.
-- Adds signed QR metadata, school-scoped pickup logs, and approval/confirmation fields.

ALTER TABLE `qr_assignments`
  ADD COLUMN IF NOT EXISTS `school_id` int(11) DEFAULT NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `token_id` varchar(64) DEFAULT NULL AFTER `school_id`,
  ADD COLUMN IF NOT EXISTS `token_hash` varchar(128) DEFAULT NULL AFTER `token_id`,
  ADD COLUMN IF NOT EXISTS `status` enum('Active','Revoked') NOT NULL DEFAULT 'Active' AFTER `image_path`,
  ADD COLUMN IF NOT EXISTS `revoked_at` datetime DEFAULT NULL AFTER `status`,
  ADD COLUMN IF NOT EXISTS `revoked_by` int(11) DEFAULT NULL AFTER `revoked_at`,
  ADD COLUMN IF NOT EXISTS `expires_at` datetime DEFAULT NULL AFTER `revoked_by`,
  ADD COLUMN IF NOT EXISTS `last_rotated_at` datetime DEFAULT NULL AFTER `expires_at`;

UPDATE `qr_assignments` qa
INNER JOIN `users` u ON u.id = qa.user_id
SET qa.school_id = u.school_id
WHERE qa.school_id IS NULL;

UPDATE `qr_assignments`
SET
  token_id = COALESCE(token_id, CONCAT('legacy-', id)),
  token_hash = COALESCE(token_hash, SHA2(qr_code, 256))
WHERE qr_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS `idx_qr_assignments_school`
  ON `qr_assignments` (`school_id`);
CREATE INDEX IF NOT EXISTS `idx_qr_assignments_token_hash`
  ON `qr_assignments` (`token_hash`);
CREATE INDEX IF NOT EXISTS `idx_qr_assignments_status`
  ON `qr_assignments` (`status`);
CREATE INDEX IF NOT EXISTS `idx_qr_assignments_school_status`
  ON `qr_assignments` (`school_id`, `status`);

ALTER TABLE `pickup_logs`
  ADD COLUMN IF NOT EXISTS `school_id` int(11) DEFAULT NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `child_id` int(11) DEFAULT NULL AFTER `qr_assignment_id`,
  ADD COLUMN IF NOT EXISTS `guardian_id` int(11) DEFAULT NULL AFTER `child_id`,
  ADD COLUMN IF NOT EXISTS `status` enum('pending','approved','rejected','confirmed','invalid','unauthorized') NOT NULL DEFAULT 'pending' AFTER `confirmed`,
  ADD COLUMN IF NOT EXISTS `approval_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `approved_by` int(11) DEFAULT NULL AFTER `approval_status`,
  ADD COLUMN IF NOT EXISTS `approved_at` datetime DEFAULT NULL AFTER `approved_by`,
  ADD COLUMN IF NOT EXISTS `rejected_by` int(11) DEFAULT NULL AFTER `approved_at`,
  ADD COLUMN IF NOT EXISTS `rejected_at` datetime DEFAULT NULL AFTER `rejected_by`,
  ADD COLUMN IF NOT EXISTS `rejection_reason` text DEFAULT NULL AFTER `rejected_at`,
  ADD COLUMN IF NOT EXISTS `scan_ip` varchar(64) DEFAULT NULL AFTER `location`,
  ADD COLUMN IF NOT EXISTS `scan_user_agent` text DEFAULT NULL AFTER `scan_ip`,
  ADD COLUMN IF NOT EXISTS `invalid_reason` text DEFAULT NULL AFTER `scan_user_agent`,
  ADD COLUMN IF NOT EXISTS `confirmed_by` int(11) DEFAULT NULL AFTER `confirmed_at`;

UPDATE `pickup_logs` pl
INNER JOIN `qr_assignments` qa ON qa.id = pl.qr_assignment_id
LEFT JOIN `users` u ON u.id = qa.user_id
SET
  pl.school_id = COALESCE(pl.school_id, qa.school_id, u.school_id),
  pl.child_id = COALESCE(pl.child_id, qa.child_id),
  pl.guardian_id = COALESCE(pl.guardian_id, qa.guardian_id),
  pl.status = CASE WHEN pl.confirmed = 1 THEN 'confirmed' ELSE pl.status END,
  pl.approval_status = CASE WHEN pl.confirmed = 1 THEN 'approved' ELSE pl.approval_status END,
  pl.confirmed_by = CASE WHEN pl.confirmed = 1 THEN COALESCE(pl.confirmed_by, pl.guard_id) ELSE pl.confirmed_by END
WHERE pl.qr_assignment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS `idx_pickup_logs_school_status`
  ON `pickup_logs` (`school_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_pickup_logs_school_scanned`
  ON `pickup_logs` (`school_id`, `scanned_at`);
CREATE INDEX IF NOT EXISTS `idx_pickup_logs_child`
  ON `pickup_logs` (`child_id`);
CREATE INDEX IF NOT EXISTS `idx_pickup_logs_guardian`
  ON `pickup_logs` (`guardian_id`);
CREATE INDEX IF NOT EXISTS `idx_pickup_logs_status`
  ON `pickup_logs` (`status`);

ALTER TABLE `guard_devices`
  ADD COLUMN IF NOT EXISTS `registered_ip_address` varchar(64) DEFAULT NULL AFTER `user_agent`,
  ADD COLUMN IF NOT EXISTS `allowed_ip_address` varchar(64) DEFAULT NULL AFTER `registered_ip_address`,
  ADD COLUMN IF NOT EXISTS `last_scan_ip` varchar(64) DEFAULT NULL AFTER `allowed_ip_address`,
  ADD COLUMN IF NOT EXISTS `last_scan_at` datetime DEFAULT NULL AFTER `last_scan_ip`;

CREATE TABLE IF NOT EXISTS `pickup_security_events` (
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
  KEY `idx_pickup_security_type` (`event_type`),
  KEY `idx_pickup_security_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
