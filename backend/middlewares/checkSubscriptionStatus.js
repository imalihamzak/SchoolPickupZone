const pool = require('../config/db');

module.exports = async function checkSubscriptionStatus(req, res, next) {
  try {
    const userId = req.user.id; 
    const [[user]] = await pool.execute(
      `SELECT u.id, u.school_id, u.created_at, s.name, sub.status, sub.next_billing_date
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       LEFT JOIN subscriptions sub ON s.id = sub.school_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) return res.status(401).json({ message: 'User not found' });

    const subscriptionStatus = user.status;
    const createdAt = new Date(user.created_at);
    const today = new Date();
    const daysSinceCreated = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));

    if (!subscriptionStatus || subscriptionStatus === 'Inactive' || subscriptionStatus === 'Cancelled') {
      if (daysSinceCreated > 7) {
        return res.status(403).json({
          blocked: true,
          message: 'Access blocked. Please complete your subscription to continue.',
        });
      }
    }

    // Attach subscription info for frontend if needed
    req.subscriptionStatus = subscriptionStatus;
    req.accountAgeDays = daysSinceCreated;
    next();
  } catch (err) {
    console.error('Subscription check failed', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
