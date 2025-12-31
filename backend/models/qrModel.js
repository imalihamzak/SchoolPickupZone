const pool = require('../config/db');

exports.getQRCodeByUser = async (userId) => {
  const [rows] = await pool.execute('SELECT * FROM qr_codes WHERE user_id = ?', [userId]);
  return rows[0];
};

exports.createOrUpdateQRCode = async (userId, code, imagePath, defaultGuardianId, defaultVehicle) => {
  const [existing] = await pool.execute('SELECT id FROM qr_codes WHERE user_id = ?', [userId]);

  if (existing.length > 0) {
    const [result] = await pool.execute(
      'UPDATE qr_codes SET code = ?, image_path = ?, default_guardian_id = ?, default_vehicle = ? WHERE user_id = ?',
      [code, imagePath, defaultGuardianId, defaultVehicle, userId]
    );
    return result;
  } else {
    const [result] = await pool.execute(
      'INSERT INTO qr_codes (user_id, code, image_path, default_guardian_id, default_vehicle) VALUES (?, ?, ?, ?, ?)',
      [userId, code, imagePath, defaultGuardianId, defaultVehicle]
    );
    return result;
  }
};
