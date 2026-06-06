-- Adds lifecycle, Stripe, failed-payment, and package-change tracking
-- required by the Super Admin subscription workflow.

ALTER TABLE `subscriptions`
  ADD COLUMN IF NOT EXISTS `stripe_subscription_id` varchar(255) DEFAULT NULL AFTER `last_payment_amount`,
  ADD COLUMN IF NOT EXISTS `stripe_customer_id` varchar(255) DEFAULT NULL AFTER `stripe_subscription_id`,
  ADD COLUMN IF NOT EXISTS `stripe_status` varchar(100) DEFAULT NULL AFTER `stripe_customer_id`,
  ADD COLUMN IF NOT EXISTS `latest_invoice_id` varchar(255) DEFAULT NULL AFTER `stripe_status`,
  ADD COLUMN IF NOT EXISTS `failed_payment_count` int(11) NOT NULL DEFAULT 0 AFTER `latest_invoice_id`,
  ADD COLUMN IF NOT EXISTS `last_payment_failed_at` datetime DEFAULT NULL AFTER `failed_payment_count`,
  ADD COLUMN IF NOT EXISTS `grace_period_ends_at` datetime DEFAULT NULL AFTER `last_payment_failed_at`,
  ADD COLUMN IF NOT EXISTS `cancel_at_period_end` tinyint(1) NOT NULL DEFAULT 0 AFTER `grace_period_ends_at`,
  ADD COLUMN IF NOT EXISTS `cancelled_at` datetime DEFAULT NULL AFTER `cancel_at_period_end`,
  ADD COLUMN IF NOT EXISTS `pending_plan_id` int(11) DEFAULT NULL AFTER `cancelled_at`,
  ADD COLUMN IF NOT EXISTS `pending_billing_interval` enum('monthly','yearly') DEFAULT NULL AFTER `pending_plan_id`,
  ADD COLUMN IF NOT EXISTS `pending_change_type` enum('upgrade','downgrade') DEFAULT NULL AFTER `pending_billing_interval`,
  ADD COLUMN IF NOT EXISTS `pending_change_effective_at` datetime DEFAULT NULL AFTER `pending_change_type`,
  ADD COLUMN IF NOT EXISTS `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() AFTER `pending_change_effective_at`;

ALTER TABLE `payments`
  ADD COLUMN IF NOT EXISTS `stripe_invoice_id` varchar(255) DEFAULT NULL AFTER `transaction_id`,
  ADD COLUMN IF NOT EXISTS `stripe_payment_intent_id` varchar(255) DEFAULT NULL AFTER `stripe_invoice_id`,
  ADD COLUMN IF NOT EXISTS `billing_reason` enum('subscription_create','subscription_cycle','upgrade_proration','manual','failed_retry') DEFAULT 'manual' AFTER `stripe_payment_intent_id`,
  ADD COLUMN IF NOT EXISTS `failure_reason` text DEFAULT NULL AFTER `billing_reason`;

CREATE TABLE IF NOT EXISTS `subscription_change_logs` (
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
  KEY `idx_subscription_change_logs_effective` (`effective_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX IF NOT EXISTS `idx_subscriptions_stripe_subscription`
  ON `subscriptions` (`stripe_subscription_id`);
CREATE INDEX IF NOT EXISTS `idx_subscriptions_pending_change`
  ON `subscriptions` (`pending_change_effective_at`);
CREATE INDEX IF NOT EXISTS `idx_subscriptions_grace_end`
  ON `subscriptions` (`grace_period_ends_at`);

CREATE INDEX IF NOT EXISTS `idx_payments_stripe_invoice`
  ON `payments` (`stripe_invoice_id`);
CREATE INDEX IF NOT EXISTS `idx_payments_billing_reason`
  ON `payments` (`billing_reason`);
