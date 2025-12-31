// controllers/notificationController.js
const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - no user ID' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, type, title, message, timestamp, \`read\` 
       FROM notifications 
       WHERE user_id = ? AND \`read\` = 0 
       ORDER BY timestamp DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Notification fetch error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
};


// Mark single notification as read
exports.markNotificationAsRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;

  try {
    await pool.execute(
      `UPDATE notifications SET \`read\` = 1 WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all as read
exports.markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.execute(
      `UPDATE notifications SET \`read\` = 1 WHERE user_id = ?`,
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};
