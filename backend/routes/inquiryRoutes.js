const express = require('express');
const router = express.Router();
const { verifyToken, allowOnly } = require('../middlewares/auth');
const {
  createInquiry,
  getSuperAdminInquiries,
  updateInquiryStatus,
} = require('../controllers/inquiryController');

router.post('/', createInquiry);
router.get('/superadmin', verifyToken, allowOnly('super-admin'), getSuperAdminInquiries);
router.patch('/superadmin/:id/status', verifyToken, allowOnly('super-admin'), updateInquiryStatus);

module.exports = router;
