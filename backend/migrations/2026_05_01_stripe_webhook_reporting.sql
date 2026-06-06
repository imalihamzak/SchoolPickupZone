-- Adds Stripe webhook event tracking and invoice metadata used by
-- Super Admin retry logs, invoice views, and billing reports.

ALTER TABLE `payments`
  ADD COLUMN IF NOT EXISTS `stripe_event_id` varchar(255) DEFAULT NULL AFTER `stripe_payment_intent_id`,
  ADD COLUMN IF NOT EXISTS `stripe_charge_id` varchar(255) DEFAULT NULL AFTER `stripe_event_id`,
  ADD COLUMN IF NOT EXISTS `invoice_number` varchar(100) DEFAULT NULL AFTER `stripe_charge_id`,
  ADD COLUMN IF NOT EXISTS `invoice_due_date` datetime DEFAULT NULL AFTER `invoice_number`,
  ADD COLUMN IF NOT EXISTS `invoice_hosted_url` varchar(500) DEFAULT NULL AFTER `invoice_due_date`,
  ADD COLUMN IF NOT EXISTS `invoice_pdf_url` varchar(500) DEFAULT NULL AFTER `invoice_hosted_url`,
  ADD COLUMN IF NOT EXISTS `attempt_count` int(11) DEFAULT NULL AFTER `invoice_pdf_url`;

CREATE TABLE IF NOT EXISTS `stripe_webhook_events` (
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

CREATE INDEX IF NOT EXISTS `idx_payments_stripe_event`
  ON `payments` (`stripe_event_id`);
CREATE INDEX IF NOT EXISTS `idx_payments_invoice_number`
  ON `payments` (`invoice_number`);
CREATE INDEX IF NOT EXISTS `idx_payments_invoice_due_date`
  ON `payments` (`invoice_due_date`);
