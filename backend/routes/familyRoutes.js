// routes/familyRoutes.js
const express = require('express');
const router = express.Router();
const { getFamilyProfile, getAllFamilies, approveFamily, denyFamily } = require('../controllers/familyController');

const { verifyToken, allowRoles, allowOnly } = require('../middlewares/auth');

router.get('/all', verifyToken, allowOnly('admin'), getAllFamilies);

router.get('/:userId', verifyToken, allowOnly('admin'), getFamilyProfile);

router.post('/:id/approve', verifyToken, allowOnly('admin'), approveFamily);
router.post('/:id/deny', verifyToken, allowOnly('admin'), denyFamily);


module.exports = router;
