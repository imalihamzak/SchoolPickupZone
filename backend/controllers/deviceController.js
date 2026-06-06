// controllers/deviceController.js
const pool = require('../config/db');
const { verifyDeviceToken } = require('../utils/token');
const { assertFeatureEnabledForSchool, getUserSchoolId } = require('../services/packageFeatureService');

const getRequestIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
};

const sameId = (left, right) => Number(left) === Number(right);

exports.registerDevice = async (req, res) => {
  try {
    const { guard_id, device_name, device_fingerprint, user_agent, token, allowed_ip_address } = req.body;

    if (!token) return res.status(401).json({ error: 'Missing token' });

    // Validate token
    const decoded = verifyDeviceToken(token);
    const tokenGuardId = decoded.guard_id ?? decoded.g;
    const tokenPurpose = decoded.purpose ?? decoded.p;
    if (tokenPurpose && tokenPurpose !== 'register_device' && tokenPurpose !== 'rd') {
      return res.status(403).json({ error: 'Invalid token purpose' });
    }
    if (Number(tokenGuardId) !== Number(guard_id)) {
      return res.status(403).json({ error: 'Invalid token for this guard' });
    }

    const schoolId = await getUserSchoolId(pool, guard_id);
    await assertFeatureEnabledForSchool(pool, schoolId, 'device_authorization');

    const requestIp = getRequestIp(req);

    await pool.execute(
      `INSERT INTO guard_devices
       (guard_id, device_name, device_fingerprint, user_agent, registered_ip_address, allowed_ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        guard_id,
        device_name || null,
        device_fingerprint,
        user_agent || null,
        requestIp,
        allowed_ip_address?.trim() || requestIp,
      ]
    );

    res.json({ message: 'Device registered successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This device is already registered' });
    }
    res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code,
      feature: err.feature,
    });
  }
};


exports.getDevicesByGuard = async (req, res) => {
  try {
    const { guardId } = req.params;
    const [[guard]] = await pool.execute(
      `SELECT id, school_id
       FROM users
       WHERE id = ? AND role = 'guard'`,
      [guardId]
    );

    if (!guard) {
      return res.status(404).json({ error: 'Guard account was not found.' });
    }

    if (!sameId(guard.school_id, req.user.school_id)) {
      return res.status(403).json({ error: 'You can only view devices for guards in your school.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM guard_devices WHERE guard_id = ? ORDER BY registered_at DESC',
      [guardId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDeviceAuthorization = async (req, res) => {
  try {
    const { guardId, deviceId } = req.params;
    const { is_active, allowed_ip_address } = req.body;

    const [[device]] = await pool.execute(
      `SELECT gd.id, gd.guard_id, gd.registered_ip_address, u.school_id
       FROM guard_devices gd
       INNER JOIN users u ON u.id = gd.guard_id
       WHERE gd.id = ? AND gd.guard_id = ?`,
      [deviceId, guardId]
    );

    if (!device) {
      return res.status(404).json({ error: 'Device was not found.' });
    }

    if (Number(device.school_id) !== Number(req.user.school_id)) {
      return res.status(403).json({ error: 'You can only manage devices for guards in your school.' });
    }

    await pool.execute(
      `UPDATE guard_devices
       SET is_active = ?,
           allowed_ip_address = ?
       WHERE id = ?`,
      [
        is_active === false || is_active === 0 || is_active === '0' ? 0 : 1,
        allowed_ip_address?.trim() || device.registered_ip_address,
        deviceId,
      ]
    );

    res.json({ message: 'Device authorization updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
