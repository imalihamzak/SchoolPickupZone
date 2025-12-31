// Required Dependencies
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Upload Document
exports.uploadDocument = async (req, res) => {
  try {
    const { type, required, child_id } = req.body;
    const userId = req.user.id;
    const file = req.files?.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const documentsDir = path.join(__dirname, '..', 'uploads', 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    const filename = `${Date.now()}_${file.name}`;
    const fullPath = path.join(documentsDir, filename);
    const dbPath = path.join('uploads', 'documents', filename).replace(/\\/g, '/');

    await file.mv(fullPath);

    const [result] = await pool.execute(
      `INSERT INTO documents (user_id, child_id, type, file_path, required, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, child_id || null, type, dbPath, required === 'true', 'pending']
    );

    res.status(201).json({ message: 'Document uploaded', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const [docs] = await pool.execute(
      `SELECT d.id, d.type, d.file_path, d.status, d.child_id, d.required, d.uploaded_at,
              c.full_name AS child_name
       FROM documents d
       LEFT JOIN children c ON d.child_id = c.id
       WHERE d.user_id = ?`,
      [userId]
    );

    const formattedDocs = docs.map(doc => ({
      id: doc.id,
      type: doc.type,
      childId: doc.child_id,
      childName: doc.child_name || null, // new addition
      fileName: path.basename(doc.file_path),
      uploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
      status: doc.status === 'approved' ? 'verified' : doc.status,
      required: !!doc.required
    }));

    res.json(formattedDocs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Document
exports.deleteDocument = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const [[doc]] = await pool.execute('SELECT file_path FROM documents WHERE id = ? AND user_id = ?', [id, userId]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const fullPath = path.resolve(doc.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await pool.execute('DELETE FROM documents WHERE id = ?', [id]);

    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve Document
exports.verifyDocument = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['approved', id]);
    res.json({ message: 'Document verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectDocument = async (req, res) => {
  const id = req.params.id;
  const { reason } = req.body;

  try {
    // Fetch document and user email
    const [[doc]] = await pool.execute(
      `SELECT d.type, u.email, u.firstName FROM documents d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.id = ?`,
      [id]
    );

    if (!doc) return res.status(404).json({ error: 'Document or user not found' });

    // Update status and rejection_reason immediately
    await pool.execute(
      'UPDATE documents SET status = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', reason, id]
    );

    // Send response immediately — admin sees toast
    res.json({ message: 'Document rejected' });

    // Send email in background (won't delay admin UI)
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: doc.email,
      subject: 'Document Rejected',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 24px; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="color: #d32f2f;">Document Rejection Notice</h2>
          <p>Dear <strong>${doc.firstName}</strong>,</p>
          <p>We hope you're doing well. This is to inform you that your submitted document titled:</p>
          <p style="margin: 12px 0; font-size: 16px;"><strong>Document Type:</strong> <span style="color: #555;">${doc.type}</span></p>
          <p style="background-color: #ffe6e6; padding: 12px; border-left: 4px solid #f44336; border-radius: 4px;">
            <strong style="color: #c62828;">Reason for Rejection:</strong><br/>${reason}
          </p>
          <p>Please review the issue and upload a corrected version of the document as soon as possible.</p>
          <p style="margin-top: 32px;">Best regards,<br/><strong>School Pickup Team</strong><br/>
          <span style="font-size: 12px; color: #888;">This is an automated message, please do not reply.</span></p>
        </div>
      `
    };

    transporter.sendMail(mailOptions).catch((err) => {
      console.error(`Email failed to send for doc ID ${id}:`, err.message);
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
