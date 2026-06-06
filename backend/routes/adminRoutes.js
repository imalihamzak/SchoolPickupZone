const express = require('express');
const { getAllParents, getParentsAndGuards, generateDeviceLink, updateUser, deleteUser } = require('../controllers/adminController');
const adminBillingController = require('../controllers/adminBillingController');
const guardDutyController = require('../controllers/guardDutyController');
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, allowRoles, allowOnly } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;


const router = express.Router();

const requireActiveAdminSubscription = (req, res, next) => {
  if (req.user.role === 'admin') {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
};

router.get('/parents', verifyToken, allowRoles(['admin', 'super-admin']), requireActiveAdminSubscription, getAllParents);

router.get('/billing/summary', verifyToken, allowOnly('admin'), adminBillingController.getBillingSummary);
router.post('/billing/change-plan', verifyToken, allowOnly('admin'), adminBillingController.changePlan);
router.post('/billing/cancel', verifyToken, allowOnly('admin'), adminBillingController.cancelSubscription);
router.post('/billing/reactivate', verifyToken, allowOnly('admin'), adminBillingController.reactivateSubscription);
router.post('/billing/portal-session', verifyToken, allowOnly('admin'), adminBillingController.createPortalSession);
router.post('/billing/checkout-session', verifyToken, allowOnly('admin'), subscriptionController.createCheckoutSession);

router.get('/users', verifyToken, allowRoles(['admin', 'super-admin']), requireActiveAdminSubscription, requireFeature('guardian_management'), getParentsAndGuards);
router.get('/duty-roster', verifyToken, allowOnly('admin'), requireActiveAdminSubscription, requireFeature('guardian_management'), guardDutyController.getDutyRoster);
router.put('/duty-roster', verifyToken, allowOnly('admin'), requireActiveAdminSubscription, requireFeature('guardian_management'), guardDutyController.updateDutyRoster);
router.post('/generate-device-link', verifyToken, allowRoles(['admin']), requireActiveAdminSubscription, requireFeature('device_authorization'), generateDeviceLink);
router.put('/parentguard/:id', verifyToken, allowOnly('admin'), requireActiveAdminSubscription, requireFeature('guardian_management'), updateUser);
router.delete('/parentguard/:id', verifyToken, allowOnly('admin'), requireActiveAdminSubscription, requireFeature('guardian_management'), deleteUser);



module.exports = router;
