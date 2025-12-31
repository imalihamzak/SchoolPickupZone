const pool = require('../config/db');

exports.getPickupLogs = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT pl.*, c.full_name AS child_name, g.full_name AS guardian_name
     FROM pickup_logs pl
     JOIN children c ON pl.child_id = c.id
     JOIN guardians g ON pl.guardian_id = g.id
     WHERE c.user_id = ? ORDER BY pickup_time DESC`,
    [userId]
  );
  return rows;
};
