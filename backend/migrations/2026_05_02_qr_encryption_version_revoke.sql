-- QR encryption/version support.
-- New QR tokens are AES-256-GCM encrypted and carry token version metadata.

ALTER TABLE `qr_assignments`
  ADD COLUMN IF NOT EXISTS `token_version` int(11) NOT NULL DEFAULT 1 AFTER `token_id`;

UPDATE `qr_assignments`
SET `token_version` = 1
WHERE `token_version` IS NULL OR `token_version` < 1;

CREATE INDEX IF NOT EXISTS `idx_qr_assignments_token_version`
  ON `qr_assignments` (`token_version`);
