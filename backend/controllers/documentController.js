const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { buildEmailTemplate } = require('../utils/emailTemplate');
const { buildPublicFileUrl } = require('../config/appUrls');
const { getAllChildren } = require('../models/childModel');
const { getAllGuardians } = require('../models/guardianModel');
const { generateQRCodesForUser } = require('../utils/qrUtil');
const { ensureNotificationTypeSchema } = require('../services/notificationTypeService');
const {
  canonicalizeDocumentType,
  getFamilyDocumentVerificationStatus,
  isDocumentVerificationRequiredForParent,
  isRequiredDocumentType,
  statusForClient,
} = require('../services/documentVerificationService');

const sameId = (left, right) => Number(left) === Number(right);

const emitToUser = (io, connectedAdmins, userId, eventName, payload) => {
  if (!io || !connectedAdmins || !userId) return;

  for (const [socketId, connectedUserId] of connectedAdmins.entries()) {
    if (String(connectedUserId) === String(userId)) {
      io.to(socketId).emit(eventName, payload);
    }
  }
};

const notifyUsers = async (userIds, title, message, type, io, connectedAdmins, extra = {}) => {
  await ensureNotificationTypeSchema(pool);

  for (const userId of userIds) {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, timestamp, \`read\`)
       VALUES (?, ?, ?, ?, NOW(), 0)`,
      [userId, type, title, message]
    );

    emitToUser(io, connectedAdmins, userId, 'pickup_event', {
      id: String(result.insertId),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    });
  }
};

const notifySchoolAdmins = async (schoolId, title, message, type, io, connectedAdmins, extra = {}) => {
  if (!schoolId) return;

  const [admins] = await pool.execute(
    `SELECT id
     FROM users
     WHERE role = 'admin'
       AND school_id = ?
       AND LOWER(COALESCE(status, 'active')) = 'active'`,
    [schoolId]
  );

  await notifyUsers(
    admins.map((admin) => admin.id),
    title,
    message,
    type,
    io,
    connectedAdmins,
    { school_id: schoolId, ...extra }
  );
};

const formatParentName = (parent) =>
  [parent?.firstName, parent?.lastName].filter(Boolean).join(' ').trim() || 'A parent';

const safeDownloadPart = (value, fallback) =>
  String(value || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || fallback;

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

const getScopedParentId = async (req) => {
  if (req.user.role === 'parent') return req.user.id;

  const parentId = Number(req.query.parent_id || req.body.parent_id);
  if (!parentId) {
    const error = new Error('Parent account is required.');
    error.statusCode = 400;
    throw error;
  }

  const [[parent]] = await pool.execute(
    'SELECT id, school_id FROM users WHERE id = ? AND role = ?',
    [parentId, 'parent']
  );

  if (!parent) {
    const error = new Error('Parent account was not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!sameId(parent.school_id, req.user.school_id)) {
    const error = new Error('You can only manage documents for families in your school.');
    error.statusCode = 403;
    throw error;
  }

  return parent.id;
};

const getAdminScopedDocument = async (req, documentId) => {
  const [[doc]] = await pool.execute(
    `SELECT d.*, u.email, u.firstName, u.lastName, u.school_id
     FROM documents d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.id = ? AND u.role = 'parent'`,
    [documentId]
  );

  if (!doc) {
    const error = new Error('Document or family was not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!sameId(doc.school_id, req.user.school_id)) {
    const error = new Error('You can only review documents for families in your school.');
    error.statusCode = 403;
    throw error;
  }

  return doc;
};

const refreshQrCodesIfDocumentsComplete = async (parentId, actorId) => {
  const documentsRequired = await isDocumentVerificationRequiredForParent(parentId);
  const verification = documentsRequired
    ? await getFamilyDocumentVerificationStatus(parentId)
    : {
      parentId,
      required: [],
      summary: { total: 0, approved: 0, pending: 0, rejected: 0, missing: 0, complete: true },
      skipped: true,
    };
  if (!verification.summary.complete) {
    return { generated: false, count: 0, reason: 'documents_incomplete', verification };
  }

  const [[parent]] = await pool.execute(
    'SELECT status FROM users WHERE id = ? AND role = ?',
    [parentId, 'parent']
  );

  if (String(parent?.status || '').toLowerCase() !== 'active') {
    const revokedCount = await revokeActiveQRCodesForParent(parentId, actorId);
    return {
      generated: false,
      count: 0,
      revoked: revokedCount > 0,
      revokedCount,
      reason: 'parent_not_active',
      verification,
    };
  }

  const qrCodes = await generateQRCodesForUser(parentId, getAllChildren, getAllGuardians, { revokedBy: actorId });
  return {
    generated: qrCodes.length > 0,
    count: qrCodes.length,
    reason: qrCodes.length ? null : 'no_children',
    verification,
  };
};

const revokeQrCodesIfDocumentsIncomplete = async (parentId, actorId) => {
  const documentsRequired = await isDocumentVerificationRequiredForParent(parentId);
  if (!documentsRequired) {
    return { revoked: false, count: 0, verification: null };
  }

  const verification = await getFamilyDocumentVerificationStatus(parentId);
  if (verification.summary.complete) {
    return { revoked: false, count: 0, verification };
  }

  const count = await revokeActiveQRCodesForParent(parentId, actorId);
  return { revoked: count > 0, count, verification };
};

exports.uploadDocument = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parent accounts can upload family documents.' });
    }

    const { type, required, child_id } = req.body;
    const userId = req.user.id;
    const file = req.files?.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!type || !String(type).trim()) return res.status(400).json({ error: 'Document type is required' });

    const canonicalType = canonicalizeDocumentType(type);
    const childId = child_id || null;
    let childName = null;

    if (childId) {
      const [[child]] = await pool.execute(
        'SELECT id, full_name FROM children WHERE id = ? AND user_id = ?',
        [childId, userId]
      );
      if (!child) return res.status(403).json({ error: 'Selected child does not belong to your family.' });
      childName = child.full_name;
    }

    const documentsDir = path.join(__dirname, '..', 'uploads', 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    const filename = `${Date.now()}_${path.basename(file.name)}`;
    const fullPath = path.join(documentsDir, filename);
    const dbPath = path.join('uploads', 'documents', filename).replace(/\\/g, '/');

    await file.mv(fullPath);

    const [result] = await pool.execute(
      `INSERT INTO documents (user_id, child_id, type, file_path, required, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, childId, canonicalType, dbPath, required === 'true' || isRequiredDocumentType(canonicalType), 'pending']
    );

    const [[parent]] = await pool.execute(
      'SELECT id, firstName, lastName, school_id FROM users WHERE id = ? AND role = ?',
      [userId, 'parent']
    );

    if (parent?.school_id) {
      const io = req.app.get('io');
      const connectedAdmins = req.app.get('connectedAdmins');
      const subject = childName ? `${canonicalType} for ${childName}` : canonicalType;
      notifySchoolAdmins(
        parent.school_id,
        'Document Review Needed',
        `${formatParentName(parent)} uploaded ${subject} for review.`,
        'document_review',
        io,
        connectedAdmins,
        {
          parent_id: userId,
          document_id: result.insertId,
          document_type: canonicalType,
          child_id: childId,
        }
      ).catch((notifyErr) => {
        console.error('Document upload notification failed:', notifyErr.message);
      });
    }

    res.status(201).json({ message: 'Document uploaded', id: result.insertId, status: 'pending' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getUserDocuments = async (req, res) => {
  try {
    const userId = await getScopedParentId(req);

    const [docs] = await pool.execute(
      `SELECT d.id, d.type, d.file_path, d.status, d.child_id, d.required, d.uploaded_at, d.rejection_reason,
              c.full_name AS child_name
       FROM documents d
       LEFT JOIN children c ON d.child_id = c.id
       WHERE d.user_id = ?
       ORDER BY d.uploaded_at DESC, d.id DESC`,
      [userId]
    );

    const formattedDocs = docs.map((doc) => ({
      id: doc.id,
      type: doc.type,
      childId: doc.child_id,
      childName: doc.child_name || null,
      fileName: path.basename(doc.file_path),
      filePath: doc.file_path,
      url: buildPublicFileUrl(doc.file_path, req),
      uploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
      status: statusForClient(doc.status),
      required: !!doc.required,
      rejectionReason: doc.rejection_reason || null,
    }));

    res.json(formattedDocs);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getSchoolDocuments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only school admins can view school documents.' });
    }

    const [docs] = await pool.execute(
      `SELECT
         d.id,
         d.user_id,
         d.type,
         d.file_path,
         d.status,
         d.child_id,
         d.required,
         d.uploaded_at,
         d.rejection_reason,
         parent.firstName AS parent_first_name,
         parent.lastName AS parent_last_name,
         parent.email AS parent_email,
         parent.phone AS parent_phone,
         parent.status AS parent_status,
         c.full_name AS child_name
       FROM documents d
       INNER JOIN users parent ON parent.id = d.user_id AND parent.role = 'parent'
       LEFT JOIN children c ON d.child_id = c.id
       WHERE parent.school_id = ?
       ORDER BY
         CASE d.status
           WHEN 'pending' THEN 0
           WHEN 'rejected' THEN 1
           ELSE 2
         END,
         d.uploaded_at DESC,
         d.id DESC`,
      [req.user.school_id]
    );

    res.json(docs.map((doc) => ({
      id: doc.id,
      parentId: doc.user_id,
      parentName: [doc.parent_first_name, doc.parent_last_name].filter(Boolean).join(' ').trim() || 'Parent',
      parentEmail: doc.parent_email || null,
      parentPhone: doc.parent_phone || null,
      parentStatus: doc.parent_status || null,
      type: doc.type,
      childId: doc.child_id,
      childName: doc.child_name || null,
      fileName: path.basename(doc.file_path),
      filePath: doc.file_path,
      url: buildPublicFileUrl(doc.file_path, req),
      uploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
      uploadedAt: doc.uploaded_at,
      status: statusForClient(doc.status),
      required: !!doc.required,
      rejectionReason: doc.rejection_reason || null,
    })));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getDocumentVerificationStatus = async (req, res) => {
  try {
    const parentId = await getScopedParentId(req);
    const verification = await getFamilyDocumentVerificationStatus(parentId);
    res.json(verification);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parent accounts can remove uploaded documents.' });
    }

    const id = req.params.id;
    const userId = req.user.id;

    const [[doc]] = await pool.execute(
      'SELECT file_path, type, required FROM documents WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const fullPath = path.resolve(__dirname, '..', doc.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await pool.execute('DELETE FROM documents WHERE id = ?', [id]);

    const qrState = (doc.required || isRequiredDocumentType(doc.type))
      ? await revokeQrCodesIfDocumentsIncomplete(userId, userId)
      : { revoked: false, count: 0 };

    res.json({
      message: 'Document deleted',
      qrRevoked: qrState.revoked,
      revokedQrCount: qrState.count,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid document.' });

    const [[doc]] = await pool.execute(
      `SELECT
         d.id,
         d.user_id,
         d.type,
         d.file_path,
         parent.firstName,
         parent.lastName,
         parent.school_id
       FROM documents d
       INNER JOIN users parent ON parent.id = d.user_id AND parent.role = 'parent'
       WHERE d.id = ?`,
      [id]
    );

    if (!doc) return res.status(404).json({ error: 'Document was not found.' });

    const canDownload =
      (req.user.role === 'parent' && sameId(req.user.id, doc.user_id)) ||
      (req.user.role === 'admin' && sameId(req.user.school_id, doc.school_id));

    if (!canDownload) {
      return res.status(403).json({ error: 'You cannot download this document.' });
    }

    const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
    const filePath = path.resolve(__dirname, '..', String(doc.file_path || ''));
    if (!filePath.startsWith(`${uploadsRoot}${path.sep}`) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document file was not found.' });
    }

    const extension = path.extname(filePath);
    const parentName = safeDownloadPart(formatParentName(doc), 'Parent');
    const documentName = safeDownloadPart(doc.type, 'Document');
    res.download(filePath, `${parentName} - ${documentName}${extension}`);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.verifyDocument = async (req, res) => {
  const id = req.params.id;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only school admins can approve documents.' });
    }

    const doc = await getAdminScopedDocument(req, id);
    await pool.execute('UPDATE documents SET status = ?, rejection_reason = NULL WHERE id = ?', ['approved', id]);
    const qrRefresh = await refreshQrCodesIfDocumentsComplete(doc.user_id, req.user.id);
    const message = qrRefresh.generated
      ? 'Document verified. QR codes are ready.'
      : qrRefresh.reason === 'parent_not_active'
        ? 'Document verified. QR codes will generate after the family account is approved.'
        : 'Document verified';

    res.json({
      message,
      qrGenerated: qrRefresh.generated,
      qrCount: qrRefresh.count,
      documentVerification: qrRefresh.verification,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.rejectDocument = async (req, res) => {
  const id = req.params.id;
  const { reason } = req.body;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only school admins can reject documents.' });
    }

    const doc = await getAdminScopedDocument(req, id);

    await pool.execute(
      'UPDATE documents SET status = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', reason || null, id]
    );

    const qrState = await revokeQrCodesIfDocumentsIncomplete(doc.user_id, req.user.id);

    res.json({
      message: 'Document rejected',
      qrRevoked: qrState.revoked,
      revokedQrCount: qrState.count,
      documentVerification: qrState.verification,
    });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"PickupZone" <${process.env.EMAIL_USER}>`,
      to: doc.email,
      subject: 'PickupZone document needs review',
      html: buildEmailTemplate({
        title: 'Document Needs Review',
        subtitle: 'A submitted document could not be approved yet.',
        greeting: `Hi ${doc.firstName || 'there'},`,
        paragraphs: [
          'One of your submitted documents needs an update before it can be approved.',
          'Please review the reason below and upload a corrected version from your PickupZone account.',
        ],
        rows: [
          { label: 'Document Type', value: doc.type || 'Document' },
          { label: 'Reason', value: reason || 'Not specified' },
        ],
        tone: 'red',
      }),
    };

    transporter.sendMail(mailOptions).catch((err) => {
      console.error(`Email failed to send for doc ID ${id}:`, err.message);
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
