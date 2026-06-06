const pool = require('../config/db');
const {
  getAllChildren,
  getChildById,
  createChild,
  updateChild,
  deleteChild: deleteChildFromModel 
} = require('../models/childModel');

const { generateQRCodesForUser } = require('../utils/qrUtil');
const { getAllGuardians } = require('../models/guardianModel');
const { ensureSchoolCanAdd, getUserSchoolId } = require('../services/subscriptionService');
const {
  getFamilyDocumentVerificationStatus,
  isDocumentVerificationRequiredForParent,
} = require('../services/documentVerificationService');

const sameId = (left, right) => Number(left) === Number(right);

const isParentActive = async (userId) => {
  const [[parent]] = await pool.execute(
    'SELECT status FROM users WHERE id = ? AND role = ?',
    [userId, 'parent']
  );
  return String(parent?.status || '').toLowerCase() === 'active';
};

const revokeActiveQRCodesForParent = async (userId, actorId) => {
  const [result] = await pool.execute(
    `UPDATE qr_assignments
     SET status = 'Revoked',
         revoked_at = NOW(),
         revoked_by = ?,
         last_rotated_at = NOW()
     WHERE user_id = ?
       AND status = 'Active'`,
    [actorId || userId, userId]
  );

  return result.affectedRows || 0;
};

const refreshQRCodesIfFamilyReady = async (userId, actorId) => {
  if (!(await isParentActive(userId))) {
    const revokedCount = await revokeActiveQRCodesForParent(userId, actorId || userId);
    return {
      generated: false,
      revoked: revokedCount > 0,
      revokedCount,
      reason: 'parent_not_active',
    };
  }

  const documentsRequired = await isDocumentVerificationRequiredForParent(userId);
  const documentVerification = documentsRequired ? await getFamilyDocumentVerificationStatus(userId) : null;

  if (documentsRequired && !documentVerification.summary.complete) {
    const revokedCount = await revokeActiveQRCodesForParent(userId, actorId || userId);
    return {
      generated: false,
      revoked: revokedCount > 0,
      revokedCount,
      reason: 'documents_incomplete',
      documentVerification,
    };
  }

  const qrCodes = await generateQRCodesForUser(userId, getAllChildren, getAllGuardians, { revokedBy: actorId || userId });
  return {
    generated: qrCodes.length > 0,
    count: qrCodes.length,
    revoked: false,
    reason: null,
    documentVerification,
  };
};

const getScopedChild = async (childId, req) => {
  const [[child]] = await pool.execute(
    `SELECT c.*, u.school_id AS parent_school_id
     FROM children c
     INNER JOIN users u ON u.id = c.user_id
     WHERE c.id = ?`,
    [childId]
  );

  if (!child) {
    const error = new Error('Child not found');
    error.statusCode = 404;
    throw error;
  }

  if (req.user.role === 'parent' && sameId(child.user_id, req.user.id)) return child;
  if (req.user.role === 'admin' && sameId(child.parent_school_id, req.user.school_id)) return child;

  const error = new Error('You can only access children in your school or family.');
  error.statusCode = 403;
  throw error;
};

exports.getChildren = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      if (req.query.parent_id) {
        const [[parent]] = await pool.execute(
          'SELECT id FROM users WHERE id = ? AND role = ? AND school_id = ?',
          [req.query.parent_id, 'parent', req.user.school_id]
        );

        if (!parent) {
          return res.status(403).json({ error: 'You can only view children for parents in your school.' });
        }

        const children = await getAllChildren(req.query.parent_id);
        return res.json(children);
      }

      const [children] = await pool.execute(
        `SELECT c.*
         FROM children c
         INNER JOIN users u ON u.id = c.user_id
         WHERE u.school_id = ?
         ORDER BY c.full_name`,
        [req.user.school_id]
      );
      return res.json(children);
    }

    const children = await getAllChildren(req.user.id);
    res.json(children);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code,
      resource: err.resource,
      limit: err.limit,
      usage: err.usage,
      requested: err.requested,
    });
  }
};

exports.getChild = async (req, res) => {
  try {
    const child = await getScopedChild(req.params.id, req);
    res.json(child);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.addChild = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parent accounts can add children to their family.' });
    }

    const userId = req.user.id;
    const { full_name, age, grade, medical_info } = req.body;
    const photo = req.files?.photo;
    let photo_path = '';
    const schoolId = await getUserSchoolId(pool, userId);

    await ensureSchoolCanAdd(pool, schoolId, 'students');

    if (photo) {
      const uploadPath = `uploads/${Date.now()}_${photo.name}`;
      await photo.mv(uploadPath);
      photo_path = uploadPath;
    }

    const result = await createChild({ user_id: userId, full_name, age, grade, medical_info, photo_path });

    const qrRefresh = await refreshQRCodesIfFamilyReady(userId, userId);

    res.status(201).json({ id: result.insertId, qrRefresh });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateChild = async (req, res) => {
  try {
    await getScopedChild(req.params.id, req);

    const { full_name, age, grade, medical_info } = req.body;
    const photo = req.files?.photo;
    let photo_path = req.body.photo_path || '';

    if (photo) {
      const uploadPath = `uploads/${Date.now()}_${photo.name}`;
      await photo.mv(uploadPath);
      photo_path = uploadPath;
    }

    await updateChild(req.params.id, { full_name, age, grade, medical_info, photo_path });
    res.json({ message: 'Child updated' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.deleteChild = async (req, res) => {
  const childId = req.params.id;

  try {
    const child = await getScopedChild(childId, req);

    // Delete related records first (due to foreign key constraints)
    await pool.execute('DELETE FROM documents WHERE child_id = ?', [childId]);
    await pool.execute('DELETE FROM qr_assignments WHERE child_id = ?', [childId]);

    // Now delete the child
    await deleteChildFromModel(childId);

    const qrRefresh = await refreshQRCodesIfFamilyReady(child.user_id, req.user.id);

    res.json({ message: 'Child deleted successfully', qrRefresh });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Failed to delete child: ' + err.message });
  }
};
