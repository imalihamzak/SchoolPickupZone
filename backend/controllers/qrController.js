const path = require('path');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { getAllChildren } = require('../models/childModel');
const { getAllGuardians } = require('../models/guardianModel');
const { getQRCodeByUser } = require('../models/qrModel');
const { generateQRCodesForUser } = require('../utils/qrUtil');
const {
  assertFamilyDocumentsApproved,
} = require('../services/documentVerificationService');
const { ensureGuardianContactSchema } = require('../services/guardianContactService');

const sameId = (left, right) => Number(left) === Number(right);

const safeDownloadPart = (value, fallback) =>
  String(value || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || fallback;

const sendError = (res, err, fallbackStatus = 500) =>
  res.status(err.statusCode || fallbackStatus).json({
    error: err.message,
    code: err.code,
    verification: err.verification,
  });

const ensureParentInAdminSchool = async (parentId, req) => {
  const [[parent]] = await pool.execute(
    `SELECT id, school_id, status
     FROM users
     WHERE id = ? AND role = 'parent'`,
    [parentId]
  );

  if (!parent) {
    const error = new Error('Parent account was not found.');
    error.statusCode = 404;
    throw error;
  }

  if (req.user.role === 'admin' && Number(parent.school_id) !== Number(req.user.school_id)) {
    const error = new Error('You can only manage QR codes for parents in your school.');
    error.statusCode = 403;
    throw error;
  }

  return parent;
};

const assertParentAccountActive = (parent) => {
  if (String(parent?.status || '').toLowerCase() === 'active') return;

  const error = new Error('Family account must be approved before QR codes can be generated or used.');
  error.statusCode = 409;
  error.code = 'PARENT_ACCOUNT_NOT_ACTIVE';
  throw error;
};

const getParentAccountForQr = async (parentId) => {
  const [[parent]] = await pool.execute(
    `SELECT id, school_id, status
     FROM users
     WHERE id = ? AND role = 'parent'`,
    [parentId]
  );

  if (!parent) {
    const error = new Error('Parent account was not found.');
    error.statusCode = 404;
    throw error;
  }

  return parent;
};

exports.getQRCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const qr = await getQRCodeByUser(userId);
    res.json(qr);
  } catch (err) {
    sendError(res, err);
  }
};

exports.generateQRCodes = async (req, res) => {
  try {
    await ensureGuardianContactSchema();
    const targetUserId = req.user.role === 'admin'
      ? Number(req.body.parent_id || req.query.parent_id)
      : req.user.id;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Parent account is required.' });
    }

    const parent = req.user.role === 'admin'
      ? await ensureParentInAdminSchool(targetUserId, req)
      : await getParentAccountForQr(targetUserId);
    assertParentAccountActive(parent);

    await assertFamilyDocumentsApproved(targetUserId, { skipIfFeatureDisabled: true });

    const results = await generateQRCodesForUser(
      targetUserId,
      getAllChildren,
      getAllGuardians,
      { revokedBy: req.user.id }
    );

    if (!results.length) {
      return res.status(400).json({ error: 'At least one child is required before QR codes can be generated.' });
    }

    res.status(201).json({ message: 'QR Codes generated', count: results.length, data: results });
  } catch (err) {
    sendError(res, err);
  }
};

exports.downloadQRCode = async (req, res) => {
  try {
    const token = req.query.token;
    const file = req.query.file;
    if (!token || !file) return res.status(400).json({ error: 'Missing token or file' });

    const actor = jwt.verify(token, process.env.JWT_SECRET);
    const safeFile = path.basename(String(file));
    const requestedPaths = [safeFile, `uploads/${safeFile}`];

    const [[qr]] = await pool.execute(
      `SELECT
         qa.id,
         qa.user_id,
         qa.school_id,
         qa.image_path,
         u.school_id AS parent_school_id,
         u.firstName AS parent_first_name,
         u.lastName AS parent_last_name,
         c.full_name AS child_name,
         g.full_name AS guardian_name,
         COALESCE(g.contact_type, 'guardian') AS guardian_contact_type
       FROM qr_assignments qa
       INNER JOIN users u ON u.id = qa.user_id
       LEFT JOIN children c ON c.id = qa.child_id
       LEFT JOIN guardians g ON g.id = qa.guardian_id
       WHERE qa.image_path IN (?, ?)
         AND qa.status = 'Active'
         AND LOWER(COALESCE(u.status, 'active')) = 'active'
       LIMIT 1`,
      requestedPaths
    );

    if (!qr) {
      return res.status(404).json({ error: 'QR code file was not found.' });
    }

    const qrSchoolId = qr.school_id || qr.parent_school_id;
    const canDownload =
      actor.role === 'super-admin' ||
      (actor.role === 'admin' && sameId(qrSchoolId, actor.school_id)) ||
      (actor.role === 'parent' && sameId(qr.user_id, actor.id));

    if (!canDownload) {
      return res.status(403).json({ error: 'You can only download QR codes in your own school or family.' });
    }

    await assertFamilyDocumentsApproved(qr.user_id, { skipIfFeatureDisabled: true });

    const uploadsDir = path.resolve(__dirname, '..', 'uploads');
    const filePath = path.resolve(uploadsDir, safeFile);
    if (!filePath.startsWith(uploadsDir + path.sep)) {
      return res.status(400).json({ error: 'Invalid QR code file.' });
    }

    const parentName = safeDownloadPart(
      [qr.parent_first_name, qr.parent_last_name].filter(Boolean).join(' '),
      'Parent'
    );
    const childName = safeDownloadPart(qr.child_name, 'Student');
    const ownerName = qr.guardian_id
      ? String(qr.guardian_contact_type || '').toLowerCase() === 'second_parent'
        ? `Second Parent ${qr.guardian_name || ''}`
        : `Guardian ${qr.guardian_name || ''}`
      : 'Primary Parent';
    const owner = safeDownloadPart(ownerName, 'Pickup');

    res.download(filePath, `${parentName} - ${childName} - ${owner} QR.png`);
  } catch (err) {
    const jwtErrorNames = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];
    res.status(jwtErrorNames.includes(err.name) ? 401 : err.statusCode || 500).json({
      error: err.message,
      code: err.code,
      verification: err.verification,
    });
  }
};

exports.getAllQRCodesForUser = async (req, res) => {
  try {
    await ensureGuardianContactSchema();
    const role = req.user.role;
    const filters = [
      `qa.status = 'Active'`,
      `LOWER(COALESCE(u.status, 'active')) = 'active'`,
      `u.role = 'parent'`,
    ];
    const params = [];

    if (role === 'admin') {
      const parentId = Number(req.query.parent_id);
      if (!parentId) {
        return res.status(400).json({
          error: 'Select a parent before viewing QR codes.',
          code: 'PARENT_REQUIRED',
        });
      }
      filters.push('qa.user_id = ?');
      params.push(parentId);
      filters.push('u.school_id = ?');
      params.push(req.user.school_id);
    } else if (role === 'parent') {
      await assertFamilyDocumentsApproved(req.user.id, { skipIfFeatureDisabled: true });
      filters.push('qa.user_id = ?');
      params.push(req.user.id);
    }

    const [rows] = await pool.execute(`
      SELECT
        qa.*,
        c.full_name as child,
        c.grade,
        g.full_name as guardian_name,
        g.relation as guardian_relation,
        COALESCE(g.contact_type, 'guardian') as guardian_contact_type
      FROM qr_assignments qa
      INNER JOIN users u ON u.id = qa.user_id
      LEFT JOIN children c ON qa.child_id = c.id
      LEFT JOIN guardians g ON qa.guardian_id = g.id
      WHERE ${filters.join(' AND ')}
      ORDER BY qa.created_at DESC
    `, params);

    const formatted = rows.map(row => ({
      id: row.id,
      child_id: row.child_id,
      child: row.child,
      grade: row.grade,
      for: row.guardian_id
        ? String(row.guardian_contact_type || '').toLowerCase() === 'second_parent'
          ? 'second_parent'
          : 'guardian'
        : 'parent',
      guardian_id: row.guardian_id,
      guardian_name: row.guardian_name,
      guardian_relation: row.guardian_relation,
      guardian_contact_type: row.guardian_contact_type,
      file: row.image_path,
      qr_code: row.qr_code,
      status: row.status,
      expires_at: row.expires_at,
      token_version: row.token_version || 1,
    }));

    res.json(formatted);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getQRCodeCount = async (req, res) => {
  try {
    const filters = [`qa.status = 'Active'`, `LOWER(COALESCE(u.status, 'active')) = 'active'`];
    const params = [];

    if (req.user.role === 'admin') {
      filters.push('u.school_id = ?');
      params.push(req.user.school_id);
    } else if (req.user.role === 'parent') {
      try {
        await assertFamilyDocumentsApproved(req.user.id, { skipIfFeatureDisabled: true });
      } catch (err) {
        if (err.code === 'DOCUMENT_VERIFICATION_REQUIRED') {
          return res.json({ count: 0, blocked: true, verification: err.verification });
        }
        throw err;
      }
      filters.push('qa.user_id = ?');
      params.push(req.user.id);
    }

    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM qr_assignments qa
       INNER JOIN users u ON u.id = qa.user_id
       WHERE ${filters.join(' AND ')}`,
      params
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    sendError(res, err);
  }
};

exports.generateQRCodesForParent = async (req, res) => {
  try {
    await ensureGuardianContactSchema();
    const parentId = Number(req.body.parent_id || req.query.parent_id);
    if (!parentId) return res.status(400).json({ error: 'Missing parent_id' });

    const parent = await ensureParentInAdminSchool(parentId, req);
    assertParentAccountActive(parent);
    await assertFamilyDocumentsApproved(parentId, { skipIfFeatureDisabled: true });

    const results = await generateQRCodesForUser(
      parentId,
      getAllChildren,
      getAllGuardians,
      { revokedBy: req.user.id }
    );

    if (!results.length) {
      return res.status(400).json({ error: 'At least one child is required before QR codes can be generated.' });
    }

    res.status(200).json({ message: 'QR Codes generated for parent', count: results.length, data: results });
  } catch (err) {
    sendError(res, err);
  }
};

exports.revokeQRCode = async (req, res) => {
  try {
    const qrId = Number(req.params.id);
    if (!qrId) return res.status(400).json({ error: 'QR code id is required.' });

    const [[qr]] = await pool.execute(
      `SELECT
         qa.id,
         qa.user_id,
         qa.school_id,
         qa.status,
         u.school_id AS parent_school_id
       FROM qr_assignments qa
       INNER JOIN users u ON u.id = qa.user_id
       WHERE qa.id = ?`,
      [qrId]
    );

    if (!qr) return res.status(404).json({ error: 'QR code was not found.' });

    const qrSchoolId = qr.school_id || qr.parent_school_id;
    const canManage =
      req.user.role === 'super-admin' ||
      (req.user.role === 'admin' && sameId(qrSchoolId, req.user.school_id)) ||
      (req.user.role === 'parent' && sameId(qr.user_id, req.user.id));

    if (!canManage) {
      return res.status(403).json({ error: 'You can only revoke QR codes in your own school.' });
    }

    if (qr.status !== 'Active') {
      return res.status(409).json({ error: 'This QR code is already revoked.' });
    }

    await pool.execute(
      `UPDATE qr_assignments
       SET status = 'Revoked',
           revoked_at = NOW(),
           revoked_by = ?,
           last_rotated_at = NOW()
       WHERE id = ? AND status = 'Active'`,
      [req.user.id, qrId]
    );

    res.json({ message: 'QR code revoked successfully.', id: qrId, status: 'Revoked' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
