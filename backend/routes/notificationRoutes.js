const express = require('express');
const { verifyToken, allowOnly, allowRoles } = require('../middlewares/auth');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/notificationController');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;

const router = express.Router();

router.use(verifyToken, allowRoles(['admin', 'parent', 'guard']));
router.use((req, res, next) => {
  if (req.user.school_id) {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
});
router.use((req, res, next) => {
  if (req.user.role === 'guard') return next();
  return requireFeature('notifications')(req, res, next);
});

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/mark-all-read', markAllNotificationsAsRead);

module.exports = router;
