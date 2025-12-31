const path = require('path');
const pool = require('../config/db');
const QRCode = require('qrcode');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { getAllChildren } = require('../models/childModel');
const { getAllGuardians } = require('../models/guardianModel');

const { getQRCodeByUser, createOrUpdateQRCode } = require('../models/qrModel');

exports.getQRCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const qr = await getQRCodeByUser(userId);
    res.json(qr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateQRCodes = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔥 Step 1: Remove old QR assignments for this user
    await pool.execute('DELETE FROM qr_assignments WHERE user_id = ?', [userId]);

    // 🔍 Step 2: Get children and guardians
    const { getAllChildren } = require('../models/childModel');
    const { getAllGuardians } = require('../models/guardianModel');
    const children = await getAllChildren(userId);
    const guardians = await getAllGuardians(userId);

    if (children.length === 0 || guardians.length === 0) {
      return res.status(400).json({ error: 'At least one child and one guardian required.' });
    }

    // 📦 Step 3: Generate associations (parent + up to 2 guardians)
    const associations = [{ type: 'parent', id: null }, ...guardians.slice(0, 2).map(g => ({ type: 'guardian', id: g.id }))];
    const results = [];

    for (const child of children) {
      for (const assoc of associations) {
        const qrData = JSON.stringify({
          user_id: userId,
          child_id: child.id,
          guardian_id: assoc.id,
          type: assoc.type
        });

        const fileName = `uploads/qr_${userId}_${child.id}_${assoc.id ?? 'parent'}_${Date.now()}.png`;
        await QRCode.toFile(fileName, qrData);

        await pool.execute(
          `INSERT INTO qr_assignments (user_id, guardian_id, child_id, qr_code, image_path)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, assoc.id, child.id, qrData, fileName]
        );

        results.push({ child: child.full_name, for: assoc.type, file: fileName });
      }
    }

    res.status(201).json({ message: 'QR Codes generated', count: results.length, data: results });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.downloadQRCode = async (req, res) => {
  try {
    const token = req.query.token;
    const file = req.query.file;
    if (!token || !file) return res.status(400).json({ error: 'Missing token or file' });

    jwt.verify(token, process.env.JWT_SECRET);
    res.download(path.resolve(`uploads/${file}`));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllQRCodesForUser = async (req, res) => {
  try {
    const role = req.user.role;
    let userFilter = '';
    let params = [];
    
    if (role === 'admin') {
      if (req.query.parent_id) {
        userFilter = 'WHERE qa.user_id = ?';
        params = [req.query.parent_id];
      } else {
        // No filter – get all QR codes for all parents
        userFilter = '';
        params = [];
      }
    } else {
      // For parent role
      userFilter = 'WHERE qa.user_id = ?';
      params = [req.user.id];
    }
    

    const [rows] = await pool.execute(`
      SELECT qa.*, c.full_name as child, g.full_name as guardian_name
      FROM qr_assignments qa
      LEFT JOIN children c ON qa.child_id = c.id
      LEFT JOIN guardians g ON qa.guardian_id = g.id
      ${userFilter}
    `, params);
    

    const formatted = rows.map(row => ({
      child_id: row.child_id,
      child: row.child,
      for: row.guardian_id ? 'guardian' : 'parent',
      guardian_id: row.guardian_id,
      guardian_name: row.guardian_name,
      file: row.image_path,
      qr_code: row.qr_code
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getQRCodeCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM qr_assignments WHERE user_id = ?', [userId]);
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.generateQRCodesForParent = async (req, res) => {
  try {
    const parentId = req.body.parent_id; // Admin sends this
    if (!parentId) return res.status(400).json({ error: 'Missing parent_id' });

    await generateQRCodesForUser(parentId, getAllChildren, getAllGuardians);

    res.status(200).json({ message: 'QR Codes generated for parent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
