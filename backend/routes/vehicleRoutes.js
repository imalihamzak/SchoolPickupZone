// routes/vehicleRoutes.js
const express = require('express');
const router = express.Router();
const { getVehicles } = require('../controllers/vehicleController');
const { verifyToken, allowRoles } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;

router.use(verifyToken);
router.use(allowRoles(['admin', 'parent']));
router.use((req, res, next) => {
  if (req.user.school_id) {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
});
router.use(requireFeature('guardian_management'));

router.get('/', getVehicles);

module.exports = router;
