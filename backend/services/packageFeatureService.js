const DEFAULT_FEATURE_TOGGLES = {
  qr_verification: true,
  guardian_management: true,
  pickup_logs: true,
  analytics: false,
  document_uploads: true,
  notifications: true,
  device_authorization: true,
};

const FEATURE_LABELS = {
  qr_verification: 'QR verification',
  guardian_management: 'Guardian management',
  pickup_logs: 'Pickup logs',
  analytics: 'Analytics',
  document_uploads: 'Document uploads',
  notifications: 'Notifications',
  device_authorization: 'Device authorization',
};

const parseFeatureToggles = (value) => {
  let parsed = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (_err) {
      parsed = {};
    }
  }

  return Object.keys(DEFAULT_FEATURE_TOGGLES).reduce((acc, key) => {
    acc[key] = Boolean(parsed?.[key] ?? DEFAULT_FEATURE_TOGGLES[key]);
    return acc;
  }, {});
};

const createFeatureError = (message, statusCode = 403, details = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, details);
  return error;
};

const getSchoolPackageState = async (executor, schoolId) => {
  if (!schoolId) return null;

  const [[subscription]] = await executor.execute(
    `SELECT
       s.id AS subscription_id,
       s.status AS subscription_status,
       s.plan_id,
       p.name AS plan_name,
       p.feature_toggles,
       p.storage_limit_mb,
       p.is_active
     FROM subscriptions s
     LEFT JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.school_id = ?
     ORDER BY s.id DESC
     LIMIT 1`,
    [schoolId]
  );

  if (!subscription?.plan_id) return null;

  return {
    ...subscription,
    feature_toggles: parseFeatureToggles(subscription.feature_toggles),
  };
};

const assertFeatureEnabledForSchool = async (executor, schoolId, featureKey) => {
  if (!schoolId) {
    return { skipped: true, reason: 'No school assigned.' };
  }

  if (!Object.prototype.hasOwnProperty.call(DEFAULT_FEATURE_TOGGLES, featureKey)) {
    throw createFeatureError(`Unknown package feature "${featureKey}".`, 500);
  }

  const packageState = await getSchoolPackageState(executor, schoolId);
  if (!packageState) {
    throw createFeatureError(
      'No package is assigned to this school. Assign a package before using this feature.',
      403,
      { code: 'PACKAGE_REQUIRED', feature: featureKey }
    );
  }

  if (!packageState.feature_toggles[featureKey]) {
    throw createFeatureError(
      `${FEATURE_LABELS[featureKey] || 'This feature'} is not enabled for the current package.`,
      403,
      {
        code: 'FEATURE_DISABLED',
        feature: featureKey,
        planId: packageState.plan_id,
        planName: packageState.plan_name,
      }
    );
  }

  return packageState;
};

const getUserSchoolId = async (executor, userId) => {
  if (!userId) return null;
  const [[user]] = await executor.execute(
    'SELECT school_id FROM users WHERE id = ?',
    [userId]
  );
  return user?.school_id || null;
};

module.exports = {
  DEFAULT_FEATURE_TOGGLES,
  FEATURE_LABELS,
  assertFeatureEnabledForSchool,
  getSchoolPackageState,
  getUserSchoolId,
  parseFeatureToggles,
};
