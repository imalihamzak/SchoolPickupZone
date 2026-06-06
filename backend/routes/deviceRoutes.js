// routes/deviceRoutes.js
const express = require('express');
const { registerDevice, getDevicesByGuard, updateDeviceAuthorization } = require('../controllers/deviceController');
const { verifyToken, allowRoles, allowOnly } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;
const router = express.Router();


router.post('/register', registerDevice);

router.use(verifyToken);
router.use(allowOnly('admin'));
router.use(checkSubscriptionStatus);
router.use(requireFeature('device_authorization'));

router.get('/:guardId', getDevicesByGuard);
router.patch('/:guardId/:deviceId', updateDeviceAuthorization);


module.exports = router;
