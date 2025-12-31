// routes/vehicleRoutes.js
const express = require('express');
const router = express.Router();
const { getVehicles } = require('../controllers/vehicleController');
const { verifyToken, allowRoles } = require('../middlewares/auth');

router.use(verifyToken);
router.use(allowRoles(['admin', 'parent']));

router.get('/', getVehicles);

module.exports = router;
