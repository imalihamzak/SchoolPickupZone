const pool = require('../config/db');
const { generateDeviceToken } = require('../utils/token');
const { buildClientUrl } = require('../config/appUrls');
const { assertUserContactAvailable } = require('../services/userContactService');

const sameId = (left, right) => Number(left) === Number(right);

const getManageableSchoolUser = async (id, req) => {
  const [[user]] = await pool.execute(
    `SELECT id, role, school_id
     FROM users
     WHERE id = ?`,
    [id]
  );

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'parent' && user.role !== 'guard') {
    const error = new Error('You can only manage parent or guard users.');
    error.statusCode = 403;
    throw error;
  }

  if (req.user.role === 'admin' && !sameId(user.school_id, req.user.school_id)) {
    const error = new Error('You can only manage users in your school.');
    error.statusCode = 403;
    throw error;
  }

  return user;
};

exports.getAllParents = async (req, res) => {
  try {
    const params = [];
    const schoolFilter = req.user.role === 'admin' ? 'AND school_id = ?' : '';
    if (req.user.role === 'admin') params.push(req.user.school_id);

    const [rows] = await pool.execute(`
      SELECT id, firstName, lastName, email, phone, status
      FROM users
      WHERE role = 'parent' ${schoolFilter}
      ORDER BY firstName, lastName, id
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};


exports.getParentsAndGuards = async (req, res) => {
  try {
    const params = [];
    const schoolFilter = req.user.role === 'admin' ? 'AND u.school_id = ?' : '';
    if (req.user.role === 'admin') params.push(req.user.school_id);

    const [rows] = await pool.execute(`
      SELECT 
        u.id, 
        u.firstName, 
        u.lastName, 
        u.email, 
        u.phone,           
        u.role, 
        u.status, 
        u.created_at,
        (
          SELECT COUNT(*) 
          FROM guard_devices gd 
          WHERE gd.guard_id = u.id
        ) AS deviceCount
      FROM users u
      WHERE u.role IN ('parent', 'guard') ${schoolFilter}
      ORDER BY u.firstName
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

// update parents and guards from admin

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, status } = req.body;
    const existingUser = await getManageableSchoolUser(id, req);
    const nextRole = role || existingUser.role;


    if (nextRole !== 'parent' && nextRole !== 'guard') {
      return res.status(403).json({ error: 'School admins can only assign parent or guard roles.' });
    }

    await assertUserContactAvailable(pool, { email, phone, excludeUserId: id });

    await pool.execute(
      `UPDATE users
       SET firstName = ?, lastName = ?, email = ?, phone = ?, role = ?, status = ?
       WHERE id = ?`,
      [firstName, lastName, email, phone, nextRole, status, id]
    );

    const [updated] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await getManageableSchoolUser(id, req);

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.generateDeviceLink = async (req, res) => {
  try {
    const { guard_id } = req.body;
    if (!guard_id) return res.status(400).json({ error: 'Guard ID is required' });

    const [[guard]] = await pool.execute(
      `SELECT id, school_id, status
       FROM users
       WHERE id = ? AND role = 'guard'`,
      [guard_id]
    );

    if (!guard) {
      return res.status(404).json({ error: 'Guard account was not found.' });
    }

    if (!sameId(guard.school_id, req.user.school_id)) {
      return res.status(403).json({ error: 'You can only generate device links for guards in your school.' });
    }

    const token = generateDeviceToken(guard_id);
    const registrationUrl = buildClientUrl(
      `/register-device?g=${encodeURIComponent(guard_id)}&t=${encodeURIComponent(token)}`
    );

    res.json({ registrationUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
