const express = require('express');
const { verifyToken, allowOnly, allowRoles } = require('../middlewares/auth');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/notificationController');

const router = express.Router();

router.use(verifyToken, allowRoles(['admin', "parent"]));

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/mark-all-read', markAllNotificationsAsRead);

module.exports = router;
