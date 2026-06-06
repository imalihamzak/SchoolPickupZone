// routes/familyRoutes.js
const express = require('express');
const router = express.Router();
const { getFamilyProfile, getAllFamilies, approveFamily, denyFamily } = require('../controllers/familyController');

const { verifyToken, allowRoles, allowOnly } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');

const requireActiveAdminSubscription = (req, res, next) => {
  if (req.user.role === 'admin') {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
};

router.get('/all', verifyToken, allowOnly('admin'), requireActiveAdminSubscription, getAllFamilies);

router.get('/:userId', verifyToken, allowOnly('admin'), requireActiveAdminSubscription, getFamilyProfile);

router.post('/:id/approve', verifyToken, allowOnly('admin'), requireActiveAdminSubscription, approveFamily);
router.post('/:id/deny', verifyToken, allowOnly('admin'), requireActiveAdminSubscription, denyFamily);


module.exports = router;
