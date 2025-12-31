// controllers/deviceController.js
const pool = require('../config/db');
const { verifyDeviceToken } = require('../utils/token');

exports.registerDevice = async (req, res) => {
  try {
    const { guard_id, device_name, device_fingerprint, user_agent, token } = req.body;

    if (!token) return res.status(401).json({ error: 'Missing token' });

    // Validate token
    const decoded = verifyDeviceToken(token);
    if (decoded.guard_id !== parseInt(guard_id)) {
      return res.status(403).json({ error: 'Invalid token for this guard' });
    }

    const registered_by = req.user?.id || null; // optional if no login required

    await pool.execute(
      `INSERT INTO guard_devices 
       (guard_id, device_name, device_fingerprint, user_agent) 
       VALUES (?, ?, ?, ?)`,
      [guard_id, device_name || null, device_fingerprint, user_agent || null]
    );

    res.json({ message: 'Device registered successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This device is already registered' });
    }
    res.status(500).json({ error: err.message });
  }
};


exports.getDevicesByGuard = async (req, res) => {
    try {
      const { guardId } = req.params;
      const [rows] = await pool.execute(
        'SELECT * FROM guard_devices WHERE guard_id = ? ORDER BY registered_at DESC',
        [guardId]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  