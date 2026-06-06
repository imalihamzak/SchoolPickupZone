// routes/pickupRoutes.js
const express = require('express');
const {
  logPickup,
  getPickupById,
  getPendingPickups,
  approvePickup,
  rejectPickup,
  confirmPickup,
  sendGuardSafetyAlert,
  getReleaseQueue,
  getAllPickups,
  getTodayStats,
  getWeeklyStats,
  getRecentPickups,
  getSchoolAdminAnalytics,
  exportPickupLogsCsv,
  exportPickupSummaryPdf,
} = require('../controllers/pickupController');
const { verifyToken, allowOnly, allowRoles } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;

const router = express.Router();

const requireActiveSchoolAccess = (req, res, next) => {
  if (['admin', 'guard', 'parent'].includes(req.user.role)) {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
};

router.use(verifyToken);
router.use(allowRoles(['admin', 'guard', 'parent', 'super-admin']));
router.use(requireActiveSchoolAccess);

router.post('/scan', allowOnly('guard'), requireFeature('qr_verification'), logPickup);
router.post('/safety-alert', allowOnly('guard'), requireFeature('qr_verification'), sendGuardSafetyAlert);
router.get('/pending', allowOnly('admin'), requireFeature('qr_verification'), getPendingPickups);
router.get('/analytics', allowOnly('admin'), requireFeature('analytics'), getSchoolAdminAnalytics);
router.get('/reports/export.csv', allowOnly('admin'), requireFeature('analytics'), exportPickupLogsCsv);
router.get('/reports/summary.pdf', allowOnly('admin'), requireFeature('analytics'), exportPickupSummaryPdf);
router.get('/stats/today', requireFeature('pickup_logs'), getTodayStats);
router.get('/stats/week', requireFeature('pickup_logs'), getWeeklyStats);
router.get('/recent', requireFeature('pickup_logs'), getRecentPickups);
router.get('/release-queue', allowOnly('guard'), requireFeature('qr_verification'), getReleaseQueue);
router.get('/', requireFeature('pickup_logs'), getAllPickups);
router.get('/:id', requireFeature('qr_verification'), getPickupById);
router.post('/:id/approve', allowOnly('admin'), requireFeature('qr_verification'), approvePickup);
router.post('/:id/reject', allowOnly('admin'), requireFeature('qr_verification'), rejectPickup);
router.post('/:id/confirm', allowOnly('guard'), requireFeature('qr_verification'), confirmPickup);

module.exports = router;
