const pool = require('../config/db');

let notificationTypesReady = false;

const NOTIFICATION_TYPES = [
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
  'billing_retry',
];

const ensureNotificationTypeSchema = async (executor = pool) => {
  if (notificationTypesReady) return;

  const enumValues = NOTIFICATION_TYPES.map((type) => `'${type}'`).join(',');
  await executor.execute(`ALTER TABLE notifications MODIFY type enum(${enumValues}) DEFAULT NULL`);
  notificationTypesReady = true;
};

module.exports = {
  ensureNotificationTypeSchema,
  NOTIFICATION_TYPES,
};
