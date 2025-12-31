const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const { createUser, getUserByEmail } = require('../models/User');
const { sendResetEmail } = require('../utils/email');
const pool = require('../config/db');

// const generateToken = (user) => {
//   return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
// };
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role.toLowerCase(), // make sure role is lowercase
      school_id: user.school_id,     // ✅ add this
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};


exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      status,
      phone
    } = req.body;

    let profilePicturePath = null;

    if (req.files && req.files.profilePicture) {
      const picture = req.files.profilePicture;
      const uploadDir = path.join(__dirname, '..', 'uploads', 'profile_pictures');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${Date.now()}_${picture.name}`;
      const filepath = path.join(uploadDir, filename);

      await picture.mv(filepath);
      profilePicturePath = `/uploads/profile_pictures/${filename}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      role: role || 'parent',
      firstName,
      lastName,
      email,
      phone: phone || null,
      password: hashedPassword,
      childName: null,
      status: status || 'inactive',
      profile_picture: profilePicturePath,
    };

    await createUser(user);
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' && err.message.includes('email')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = generateToken(user);
    console.log("Generated token payload:", user);

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profile_picture: user.profile_picture || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    await sendResetEmail(user.email, token);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllParents = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'admin' && role !== 'superadmin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [rows] = await pool.execute(
      `SELECT id, firstName, lastName, profile_picture FROM users WHERE role = 'parent' ORDER BY firstName`
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET /api/auth/me
exports.getProfile = async (req, res) => {
  try {
    const [[user]] = await pool.execute(
      `SELECT id, role, firstName, lastName, email, phone, profile_picture, school_id, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get subscription status
    const [[subscription]] = await pool.execute(
      `SELECT status FROM subscriptions 
       WHERE school_id = ? AND status = 'Active'
       ORDER BY id DESC LIMIT 1`,
      [user.school_id]
    );

    const subscriptionStatus = subscription?.status || 'Inactive';

    // Calculate account age in days
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const accountAgeDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Return profile + new fields
    res.json({
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profile_picture: user.profile_picture,
      subscriptionStatus,
      accountAgeDays,
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: err.message });
  }
};


// PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    let profilePicturePath = null;

    if (req.files && req.files.profilePicture) {
      const picture = req.files.profilePicture;
      const uploadDir = path.join(__dirname, '..', 'uploads', 'profile_pictures');

      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const filename = `${Date.now()}_${picture.name}`;
      const filepath = path.join(uploadDir, filename);
      await picture.mv(filepath);

      profilePicturePath = `/uploads/profile_pictures/${filename}`;

      await pool.execute(
        'UPDATE users SET profile_picture = ? WHERE id = ?',
        [profilePicturePath, req.user.id]
      );
    }

    await pool.execute(
      'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ? WHERE id = ?',
      [firstName, lastName, email, phone, req.user.id]
    );

    const [updatedRows] = await pool.execute(
      'SELECT id, role, firstName, lastName, email, phone, profile_picture FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(updatedRows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.setPasswordFromToken = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Step 1: Validate the token
    const [rows] = await pool.execute(
      `SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()`,
      [email, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Step 2: Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Step 3: Update user password + status
    await pool.execute(
      `UPDATE users SET password = ?, status = 'active' WHERE email = ?`,
      [hashedPassword, email]
    );

    // Step 4: Clean up the token
    await pool.execute(`DELETE FROM password_resets WHERE email = ?`, [email]);

    res.json({ message: 'Password set successfully. You can now log in.' });

  } catch (err) {
    console.error('Set Password Error:', err.message);
    res.status(500).json({ error: 'Server error while setting password' });
  }
};

