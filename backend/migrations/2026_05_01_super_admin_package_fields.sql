-- Upgrade subscription_plans into SRS packages.
-- Run this once against the current pickupzone database before using the
-- updated Super Admin package management screens.

ALTER TABLE `subscription_plans`
  ADD COLUMN IF NOT EXISTS `monthly_price` decimal(10,2) NOT NULL DEFAULT 0.00 AFTER `price`,
  ADD COLUMN IF NOT EXISTS `yearly_price` decimal(10,2) NOT NULL DEFAULT 0.00 AFTER `monthly_price`,
  ADD COLUMN IF NOT EXISTS `max_students` int(11) DEFAULT NULL AFTER `yearly_price`,
  ADD COLUMN IF NOT EXISTS `max_families` int(11) DEFAULT NULL AFTER `max_students`,
  ADD COLUMN IF NOT EXISTS `max_guards` int(11) DEFAULT NULL AFTER `max_families`,
  ADD COLUMN IF NOT EXISTS `storage_limit_mb` int(11) DEFAULT NULL AFTER `max_guards`,
  ADD COLUMN IF NOT EXISTS `grace_period_days` int(11) NOT NULL DEFAULT 7 AFTER `storage_limit_mb`,
  ADD COLUMN IF NOT EXISTS `feature_toggles` longtext DEFAULT NULL AFTER `features`,
  ADD COLUMN IF NOT EXISTS `is_active` tinyint(1) NOT NULL DEFAULT 1 AFTER `feature_toggles`,
  ADD COLUMN IF NOT EXISTS `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() AFTER `created_at`;

ALTER TABLE `schools`
  ADD COLUMN IF NOT EXISTS `status` enum('Active','Suspended') NOT NULL DEFAULT 'Active' AFTER `student_count`,
  ADD COLUMN IF NOT EXISTS `suspension_reason` text DEFAULT NULL AFTER `status`,
  ADD COLUMN IF NOT EXISTS `suspended_at` datetime DEFAULT NULL AFTER `suspension_reason`;

ALTER TABLE `subscriptions`
  ADD COLUMN IF NOT EXISTS `billing_interval` enum('monthly','yearly') DEFAULT 'monthly' AFTER `plan_id`;

UPDATE `subscription_plans`
SET
  `monthly_price` = CASE
    WHEN `monthly_price` = 0.00 AND `billing_interval` = 'monthly' THEN `price`
    ELSE `monthly_price`
  END,
  `yearly_price` = CASE
    WHEN `yearly_price` = 0.00 AND `billing_interval` = 'yearly' THEN `price`
    ELSE `yearly_price`
  END;

UPDATE `subscription_plans`
SET
  `feature_toggles` = COALESCE(
    `feature_toggles`,
    '{"qr_verification":true,"guardian_management":true,"pickup_logs":true,"analytics":false,"document_uploads":true,"notifications":true,"device_authorization":true}'
  );
