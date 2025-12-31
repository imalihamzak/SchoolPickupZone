// routes/deviceRoutes.js
const express = require('express');
const { registerDevice, getDevicesByGuard } = require('../controllers/deviceController');
const { verifyToken, allowRoles, allowOnly } = require('../middlewares/auth');
const router = express.Router();


router.post('/register', registerDevice);

router.use(verifyToken);
router.use(allowOnly('admin'));

router.get('/:guardId', getDevicesByGuard);


module.exports = router;
