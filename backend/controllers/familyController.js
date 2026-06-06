// controllers/familyController.js
const pool = require('../config/db');
const { buildPublicFileUrl } = require('../config/appUrls');
const { getAllChildren } = require('../models/childModel');
const { getAllGuardians } = require('../models/guardianModel');
const { generateQRCodesForUser } = require('../utils/qrUtil');
const {
  assertFamilyDocumentsApproved,
  getFamilyDocumentVerificationStatus,
  statusForClient,
} = require('../services/documentVerificationService');
const {
  CONTACT_TYPE_GUARDIAN,
  contactTypeWhere,
  ensureGuardianContactSchema,
} = require('../services/guardianContactService');

const formatFullName = (user = {}) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || 'Parent';

const revokeActiveQRCodesForParent = async (parentId, actorId) => {
  const [result] = await pool.execute(
    `UPDATE qr_assignments
     SET status = 'Revoked',
         revoked_at = NOW(),
         revoked_by = ?,
         last_rotated_at = NOW()
     WHERE user_id = ?
       AND status = 'Active'`,
    [actorId || parentId, parentId]
  );

  return result.affectedRows || 0;
};

exports.getFamilyProfile = async (req, res) => {
  try {
    await ensureGuardianContactSchema();
    const userId = req.params.userId;

    // Get parent
    const [[parent]] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, status, created_at FROM users WHERE id = ? AND school_id = ?',
      [userId, req.user.school_id]
    );

    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    // Get children
    const [children] = await pool.execute(
      'SELECT full_name AS name, age, grade, medical_info AS medical FROM children WHERE user_id = ?',
      [userId]
    );

    // Get guardians + vehicle
    const [guardianRows] = await pool.execute(`
      SELECT g.full_name AS name, g.relation, g.phone,
             v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
      FROM guardians g
      LEFT JOIN vehicles v ON g.id = v.guardian_id
      WHERE g.user_id = ?
        AND ${contactTypeWhere('g', CONTACT_TYPE_GUARDIAN)}
    `, [userId]);

    const guardians = guardianRows.map(row => ({
      name: row.name,
      relation: row.relation,
      phone: row.phone,
      vehicle: row.vehicle_name ? {
        name: row.vehicle_name,
        make: row.make,
        model: row.model,
        color: row.color,
        plate_number: row.plate_number,
        year: row.year
      } : null
    }));

    // Get documents
    const [documents] = await pool.execute(
      `SELECT id, child_id, type AS name, file_path, status, rejection_reason, required FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC, id DESC`,
      [userId]
    );

    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      documentType: doc.name,
      type: doc.file_path.split('.').pop() || 'file',
      status: statusForClient(doc.status),
      childId: doc.child_id,
      required: Boolean(doc.required),
      rejectionReason: doc.rejection_reason || null,
      file_path: doc.file_path,
      url: buildPublicFileUrl(doc.file_path, req)
    }));
    const documentVerification = await getFamilyDocumentVerificationStatus(userId);

    res.json({
      id: parent.id,
      familyName: formatFullName(parent),
      status: parent.status === 'active' ? 'Active' : 'Pending',
      submittedAt: parent.created_at,
      parent: {
        name: formatFullName(parent),
        email: parent.email,
        phone: parent.phone,
        address: 'N/A'
      },
      children,
      guardians,
      documents: formattedDocs,
      documentVerification
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllFamilies = async (req, res) => {
  try {
    await ensureGuardianContactSchema();
    const [parents] = await pool.execute(
      `SELECT * FROM users WHERE role = 'parent' AND school_id = ?`,
      [req.user.school_id]
    );

    const families = await Promise.all(
      parents.map(async (parent) => {
        const userId = parent.id;

        // Get children
        const [children] = await pool.execute(
          'SELECT full_name AS name, age, grade, medical_info AS medical FROM children WHERE user_id = ?',
          [userId]
        );

        // Get guardians with vehicles
        const [guardianRows] = await pool.execute(`
          SELECT g.full_name AS name, g.relation, g.phone,
                v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
          FROM guardians g
          LEFT JOIN vehicles v ON g.id = v.guardian_id
          WHERE g.user_id = ?
            AND ${contactTypeWhere('g', CONTACT_TYPE_GUARDIAN)}
        `, [userId]);

        const guardians = guardianRows.map(row => ({
          name: row.name,
          relation: row.relation,
          phone: row.phone,
          vehicle: row.vehicle_name ? {
            name: row.vehicle_name,
            make: row.make,
            model: row.model,
            color: row.color,
            plate_number: row.plate_number,
            year: row.year
          } : null
        }));

        // Get documents
        const [documents] = await pool.execute(
          'SELECT id, child_id, type AS name, file_path, status, rejection_reason, required FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC, id DESC',
          [userId]
        );

        const formattedDocs = documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          documentType: doc.name,
          type: doc.file_path.split('.').pop(),
          status: statusForClient(doc.status),
          childId: doc.child_id,
          required: Boolean(doc.required),
          rejectionReason: doc.rejection_reason || null,
          file_path: doc.file_path,
          url: buildPublicFileUrl(doc.file_path, req)
        }));
        const documentVerification = await getFamilyDocumentVerificationStatus(userId);
        

        return {
          id: userId,
          familyName: formatFullName(parent),
          status: parent.status === 'active' ? 'Active' : 'Pending',
          submittedAt: parent.created_at,
          parent: {
            name: formatFullName(parent),
            email: parent.email,
            phone: parent.phone,
            address: 'N/A',
          },
          guardians,
          children,
          documents: formattedDocs,
          documentVerification
        };
      })
    );

    res.json(families);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// controllers/familyController.js
exports.approveFamily = async (req, res) => {
  const userId = req.params.id;
  try {
    await ensureGuardianContactSchema();
    const [[parent]] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role = ? AND school_id = ?',
      [userId, 'parent', req.user.school_id]
    );

    if (!parent) {
      return res.status(404).json({ error: 'Parent family was not found in your school.' });
    }

    let documentVerification;
    try {
      documentVerification = await assertFamilyDocumentsApproved(userId, { skipIfFeatureDisabled: true });
    } catch (verificationErr) {
      if (verificationErr.code !== 'DOCUMENT_VERIFICATION_REQUIRED') throw verificationErr;
      return res.status(409).json({
        error: 'Required family documents must be approved before the family account can be activated.',
        code: 'DOCUMENT_VERIFICATION_REQUIRED',
        verification: verificationErr.verification,
      });
    }

    const qrCodes = await generateQRCodesForUser(userId, getAllChildren, getAllGuardians, { revokedBy: req.user.id });

    await pool.execute(
      'UPDATE users SET status = ? WHERE id = ? AND role = ? AND school_id = ?',
      ['active', userId, 'parent', req.user.school_id]
    );

    res.json({
      message: qrCodes.length
        ? 'Family approved. QR codes generated.'
        : 'Family approved. QR codes will be available after a child is added.',
      qrGenerated: qrCodes.length > 0,
      qrCount: qrCodes.length,
      documentVerification,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.denyFamily = async (req, res) => {
  const userId = req.params.id;
  const { reason } = req.body;

  try {
    const [updateResult] = await pool.execute(
      'UPDATE users SET status = ? WHERE id = ? AND role = ? AND school_id = ?',
      ['inactive', userId, 'parent', req.user.school_id]
    );

    if (!updateResult.affectedRows) {
      return res.status(404).json({ error: 'Parent family was not found in your school.' });
    }

    const revokedQrCount = await revokeActiveQRCodesForParent(userId, req.user.id);

    // Optionally store denial reason in a `denial_reasons` table if you want
    // await pool.execute('INSERT INTO denial_reasons (user_id, reason) VALUES (?, ?)', [userId, reason]);
    void reason;

    res.json({ message: 'Family denied', qrRevoked: revokedQrCount > 0, revokedQrCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
