const pool = require('../config/db');
const { refreshSubscriptionLifecycle } = require('../services/subscriptionService');
const fs = require('fs');
const path = require('path');
const {
  assertFeatureEnabledForSchool,
  getSchoolPackageState,
  getUserSchoolId,
} = require('../services/packageFeatureService');

const resolveRequestSchoolId = async (req) => {
  if (req.user?.school_id) return req.user.school_id;
  return getUserSchoolId(pool, req.user?.id);
};

const earliestValidDate = (...values) => {
  const dates = values
    .map((value) => (value ? new Date(value) : null))
    .filter((date) => date && !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  return dates[0] || new Date();
};

const getIncomingUploadBytes = (files) => {
  if (!files) return 0;

  const values = Array.isArray(files) ? files : Object.values(files);
  return values.reduce((total, fileValue) => {
    if (Array.isArray(fileValue)) return total + getIncomingUploadBytes(fileValue);
    return total + Number(fileValue?.size || 0);
  }, 0);
};

const resolveDocumentPath = (filePath) => {
  if (!filePath) return null;
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(__dirname, '..', String(filePath).replace(/^\/+/, ''));
};

const getExistingDocumentStorageBytes = async (schoolId) => {
  const [documents] = await pool.execute(
    `SELECT d.file_path
     FROM documents d
     JOIN users u ON u.id = d.user_id
     WHERE u.school_id = ?`,
    [schoolId]
  );

  return documents.reduce((total, document) => {
    const fullPath = resolveDocumentPath(document.file_path);
    if (!fullPath || !fs.existsSync(fullPath)) return total;
    return total + fs.statSync(fullPath).size;
  }, 0);
};

async function checkSubscriptionStatus(req, res, next) {
  try {
    const userId = req.user.id; 

    if (req.user.school_id) {
      await refreshSubscriptionLifecycle(pool, req.user.school_id);
    }

    const [[user]] = await pool.execute(
      `SELECT
         u.id,
         u.school_id,
         u.created_at,
         s.name,
         s.status AS school_status,
         s.created_at AS school_created_at,
         first_admin.created_at AS first_admin_created_at,
         sub.status AS subscription_status,
         sub.next_billing_date,
         sub.end_date,
         sub.grace_period_ends_at,
         sub.cancel_at_period_end,
         p.grace_period_days
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       LEFT JOIN (
         SELECT school_id, MIN(created_at) AS created_at
         FROM users
         WHERE role = 'admin'
         GROUP BY school_id
       ) first_admin ON first_admin.school_id = s.id
       LEFT JOIN subscriptions sub ON sub.id = (
         SELECT sub2.id
         FROM subscriptions sub2
         WHERE sub2.school_id = s.id
         ORDER BY sub2.id DESC
         LIMIT 1
       )
       LEFT JOIN subscription_plans p ON p.id = sub.plan_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.school_status === 'Suspended') {
      return res.status(403).json({
        blocked: true,
        message: 'Access blocked. This school has been suspended by the platform administrator.',
      });
    }

    const subscriptionStatus = user.subscription_status;
    const firstAdminCreatedAt = user.first_admin_created_at
      ? new Date(user.first_admin_created_at)
      : null;
    const onboardingStartedAt =
      firstAdminCreatedAt && !Number.isNaN(firstAdminCreatedAt.getTime())
        ? firstAdminCreatedAt
        : earliestValidDate(user.school_created_at, user.created_at);
    const today = new Date();
    const daysSinceCreated = Math.max(
      Math.floor((today - onboardingStartedAt) / (1000 * 60 * 60 * 24)),
      0
    );
    const gracePeriodDays = Math.max(Number(user.grace_period_days ?? 7), 0);
    const subscriptionEnd = user.end_date ? new Date(user.end_date) : null;
    const gracePeriodEnd = user.grace_period_ends_at ? new Date(user.grace_period_ends_at) : null;
    const hasPaidAccessUntilPeriodEnd =
      subscriptionStatus === 'Cancelled' &&
      user.cancel_at_period_end &&
      subscriptionEnd &&
      subscriptionEnd >= today;
    const hasPastDueGraceAccess =
      subscriptionStatus === 'Expiring Soon' &&
      gracePeriodEnd &&
      gracePeriodEnd >= today;

    if (subscriptionStatus === 'Active' || hasPaidAccessUntilPeriodEnd || hasPastDueGraceAccess) {
      req.subscriptionStatus = subscriptionStatus;
      req.accountAgeDays = daysSinceCreated;
      req.gracePeriodDays = gracePeriodDays;
      return next();
    }

    if (!subscriptionStatus || subscriptionStatus === 'Inactive' || subscriptionStatus === 'Cancelled') {
      if (daysSinceCreated >= gracePeriodDays) {
        await pool.execute(
          `UPDATE schools
           SET status = 'Suspended',
               suspension_reason = ?,
               suspended_at = COALESCE(suspended_at, ?)
           WHERE id = ?`,
          ['Subscription grace period expired.', new Date(), user.school_id]
        );
        return res.status(403).json({
          blocked: true,
          message: 'Access blocked. Please complete your subscription to continue.',
        });
      }
    }

    // Attach subscription info for frontend if needed
    req.subscriptionStatus = subscriptionStatus;
    req.accountAgeDays = daysSinceCreated;
    req.gracePeriodDays = gracePeriodDays;
    next();
  } catch (err) {
    console.error('Subscription check failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const requireFeature = (featureKey) => async (req, res, next) => {
  try {
    if (req.user?.role === 'super-admin') return next();

    const schoolId = await resolveRequestSchoolId(req);
    if (schoolId) {
      await refreshSubscriptionLifecycle(pool, schoolId);
    }

    await assertFeatureEnabledForSchool(pool, schoolId, featureKey);
    next();
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code,
      feature: err.feature,
      planId: err.planId,
      planName: err.planName,
    });
  }
};

const ensureStorageAvailable = async (req, res, next) => {
  try {
    if (req.user?.role === 'super-admin') return next();

    const incomingBytes = getIncomingUploadBytes(req.files);
    if (!incomingBytes) return next();

    const schoolId = await resolveRequestSchoolId(req);
    if (!schoolId) return next();

    await refreshSubscriptionLifecycle(pool, schoolId);

    const packageState = await getSchoolPackageState(pool, schoolId);
    const storageLimitMb = packageState?.storage_limit_mb;
    if (storageLimitMb === null || storageLimitMb === undefined) return next();

    const limitBytes = Number(storageLimitMb) * 1024 * 1024;
    const currentBytes = await getExistingDocumentStorageBytes(schoolId);
    const nextBytes = currentBytes + incomingBytes;

    if (nextBytes > limitBytes) {
      return res.status(403).json({
        error: `Storage limit reached: uploads would use ${(nextBytes / 1024 / 1024).toFixed(2)} MB of ${Number(storageLimitMb)} MB.`,
        code: 'STORAGE_LIMIT_REACHED',
        limitMb: Number(storageLimitMb),
        currentMb: Number((currentBytes / 1024 / 1024).toFixed(2)),
        incomingMb: Number((incomingBytes / 1024 / 1024).toFixed(2)),
      });
    }

    next();
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code,
    });
  }
};

module.exports = checkSubscriptionStatus;
module.exports.requireFeature = requireFeature;
module.exports.ensureStorageAvailable = ensureStorageAvailable;
