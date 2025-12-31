const pool = require('../config/db');
const { generateDeviceToken } = require('../utils/token');

exports.getAllParents = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, firstName, lastName
      FROM users
      WHERE role = 'parent'
      ORDER BY firstName
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getParentsAndGuards = async (req, res) => {
  try {
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
      WHERE u.role IN ('parent', 'guard')
      ORDER BY u.firstName
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// update parents and guards from admin

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, status } = req.body;

    const [existing] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'User not found' });

    await pool.execute(
      `UPDATE users
       SET firstName = ?, lastName = ?, email = ?, phone = ?, role = ?, status = ?
       WHERE id = ?`,
      [firstName, lastName, email, phone, role, status, id]
    );

    const [updated] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // Only allow deletion of guards or parents
    if (user.role !== 'parent' && user.role !== 'guard') {
      return res.status(403).json({ error: 'You can only delete parent or guard users' });
    }

    // Optional: Clean up any child or guard-specific dependencies here if needed

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateDeviceLink = async (req, res) => {
  try {
    const { guard_id } = req.body;
    if (!guard_id) return res.status(400).json({ error: 'Guard ID is required' });

    const token = generateDeviceToken(guard_id);
    const clientUrl = process.env.CLIENT_URL;

    if (!clientUrl) {
      return res.status(500).json({ error: 'CLIENT_URL not set in environment variables' });
    }

    const registrationUrl = `${clientUrl}/register-device?guardId=${guard_id}&token=${token}`;

    res.json({ registrationUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
