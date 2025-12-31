const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const [[{ students }]] = await pool.execute(`SELECT COUNT(*) as students FROM children`);
    const [[{ parents }]] = await pool.execute(`SELECT COUNT(*) as parents FROM users WHERE role = 'parent'`);
    const [[{ guards }]] = await pool.execute(`SELECT COUNT(*) as guards FROM users WHERE role = 'guard'`);
    const [[{ qrCodes }]] = await pool.execute(`SELECT COUNT(*) as qrCodes FROM qr_assignments`);

    res.json({ students, parents, guards, qrCodes });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: err.message });
  }
};
