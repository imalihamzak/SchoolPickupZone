const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const VALID_STATUSES = new Set(['New', 'In Progress', 'Closed']);

const ensureInquiryTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      school_id INT NULL,
      user_id INT NULL,
      name VARCHAR(140) NOT NULL,
      email VARCHAR(180) NOT NULL,
      phone VARCHAR(40) NULL,
      subject VARCHAR(180) NULL,
      message TEXT NOT NULL,
      source VARCHAR(80) NULL,
      status ENUM('New', 'In Progress', 'Closed') NOT NULL DEFAULT 'New',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_contact_inquiries_status (status),
      INDEX idx_contact_inquiries_school (school_id),
      INDEX idx_contact_inquiries_created (created_at)
    )
  `);
};

const normalizeText = (value, maxLength = 1000) => {
  const text = String(value || '').trim();
  return text ? text.slice(0, maxLength) : '';
};

const getOptionalActor = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  try {
    return jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (_err) {
    return null;
  }
};

exports.createInquiry = async (req, res) => {
  try {
    await ensureInquiryTable();

    const actor = getOptionalActor(req);
    const name = normalizeText(req.body.name, 140);
    const email = normalizeText(req.body.email, 180).toLowerCase();
    const phone = normalizeText(req.body.phone, 40) || null;
    const subject = normalizeText(req.body.subject, 180) || 'Contact request';
    const message = normalizeText(req.body.message, 5000);
    const source = normalizeText(req.body.source, 80) || null;
    const schoolId = actor?.school_id || null;
    const userId = actor?.id || null;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO contact_inquiries (
         school_id,
         user_id,
         name,
         email,
         phone,
         subject,
         message,
         source
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, userId, name, email, phone, subject, message, source]
    );

    res.status(201).json({
      message: 'Your inquiry has been sent to Pickup Zone support.',
      id: result.insertId,
    });
  } catch (err) {
    console.error('Failed to create contact inquiry:', err.message);
    res.status(500).json({ error: 'Failed to send inquiry.' });
  }
};

exports.getSuperAdminInquiries = async (req, res) => {
  try {
    await ensureInquiryTable();

    const filters = [];
    const params = [];
    const { status, search } = req.query;

    if (status && status !== 'all') {
      filters.push('ci.status = ?');
      params.push(status);
    }

    if (search) {
      const like = `%${search}%`;
      filters.push(`(
        ci.name LIKE ?
        OR ci.email LIKE ?
        OR ci.phone LIKE ?
        OR ci.subject LIKE ?
        OR ci.message LIKE ?
        OR s.name LIKE ?
      )`);
      params.push(like, like, like, like, like, like);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT
         ci.id,
         ci.school_id,
         ci.user_id,
         ci.name,
         ci.email,
         ci.phone,
         ci.subject,
         ci.message,
         ci.source,
         ci.status,
         ci.created_at,
         ci.updated_at,
         s.name AS school_name,
         u.firstName AS user_first_name,
         u.lastName AS user_last_name
       FROM contact_inquiries ci
       LEFT JOIN schools s ON s.id = ci.school_id
       LEFT JOIN users u ON u.id = ci.user_id
       ${whereClause}
       ORDER BY ci.created_at DESC, ci.id DESC
       LIMIT 300`,
      params
    );

    const [[summary]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'New') AS new_count,
         SUM(status = 'In Progress') AS in_progress_count,
         SUM(status = 'Closed') AS closed_count
       FROM contact_inquiries`
    );

    res.json({
      inquiries: rows,
      summary: {
        total: Number(summary?.total || 0),
        new: Number(summary?.new_count || 0),
        inProgress: Number(summary?.in_progress_count || 0),
        closed: Number(summary?.closed_count || 0),
      },
    });
  } catch (err) {
    console.error('Failed to load contact inquiries:', err.message);
    res.status(500).json({ error: 'Failed to load inquiries.' });
  }
};

exports.updateInquiryStatus = async (req, res) => {
  try {
    await ensureInquiryTable();

    const status = normalizeText(req.body.status, 40);
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid inquiry status.' });
    }

    const [result] = await pool.execute(
      'UPDATE contact_inquiries SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    res.json({ message: 'Inquiry status updated.', status });
  } catch (err) {
    console.error('Failed to update contact inquiry:', err.message);
    res.status(500).json({ error: 'Failed to update inquiry.' });
  }
};
