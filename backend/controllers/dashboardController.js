const pool = require('../config/db');
const { getLatestSubscription, getSchoolUsage } = require('../services/subscriptionService');
const fs = require('fs');
const path = require('path');

const resolveDocumentPath = (filePath) => {
  if (!filePath) return null;
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(__dirname, '..', String(filePath).replace(/^\/+/, ''));
};

const getDocumentStorageMb = async (schoolId) => {
  const [documents] = await pool.execute(
    `SELECT d.file_path
     FROM documents d
     JOIN users u ON u.id = d.user_id
     WHERE u.school_id = ?`,
    [schoolId]
  );

  const bytes = documents.reduce((total, document) => {
    const fullPath = resolveDocumentPath(document.file_path);
    if (!fullPath || !fs.existsSync(fullPath)) return total;
    return total + fs.statSync(fullPath).size;
  }, 0);

  return Number((bytes / 1024 / 1024).toFixed(2));
};

exports.getDashboardStats = async (req, res) => {
  try {
    const schoolFilter = req.user.role === 'admin' ? 'AND u.school_id = ?' : '';
    const params = req.user.role === 'admin' ? [req.user.school_id] : [];

    const [[{ students }]] = await pool.execute(
      `SELECT COUNT(*) as students
       FROM children c
       INNER JOIN users u ON u.id = c.user_id
       WHERE 1 = 1 ${schoolFilter}`,
      params
    );
    const [[{ parents }]] = await pool.execute(
      `SELECT COUNT(*) as parents
       FROM users u
       WHERE u.role = 'parent' ${schoolFilter}`,
      params
    );
    const [[{ guards }]] = await pool.execute(
      `SELECT COUNT(*) as guards
       FROM users u
       WHERE u.role = 'guard' ${schoolFilter}`,
      params
    );
    const [[{ qrCodes }]] = await pool.execute(
      `SELECT COUNT(*) as qrCodes
       FROM qr_assignments qa
       INNER JOIN users u ON u.id = qa.user_id
       WHERE qa.status = 'Active'
         AND LOWER(COALESCE(u.status, 'active')) = 'active'
         ${schoolFilter}`,
      params
    );

    let packageUsage = null;
    if (req.user.role === 'admin' && req.user.school_id) {
      const subscription = await getLatestSubscription(pool, req.user.school_id);
      if (subscription?.plan_id) {
        const usage = await getSchoolUsage(pool, req.user.school_id);
        const storageUsedMb = await getDocumentStorageMb(req.user.school_id);
        packageUsage = {
          planId: subscription.plan_id,
          planName: subscription.plan_name,
          billingInterval: subscription.billing_interval || 'monthly',
          status: subscription.status || null,
          students: {
            used: usage.students,
            limit: subscription.max_students ?? null,
          },
          families: {
            used: usage.families,
            limit: subscription.max_families ?? null,
          },
          guards: {
            used: usage.guards,
            limit: subscription.max_guards ?? null,
          },
          storage: {
            used: storageUsedMb,
            limit: subscription.storage_limit_mb ?? null,
          },
        };
      }
    }

    res.json({ students, parents, guards, qrCodes, packageUsage });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: err.message });
  }
};
