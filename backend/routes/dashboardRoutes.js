const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { verifyToken, allowRoles } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;

router.use(verifyToken);
router.use(allowRoles(['admin', 'super-admin', 'parent']));

router.use((req, res, next) => {
  if (req.user.role === 'admin') {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
});

router.get('/stats', requireFeature('analytics'), getDashboardStats);

module.exports = router;
