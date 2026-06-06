const express = require('express');
const router = express.Router();
const { 
  getAllQRCodesForUser, 
  generateQRCodes,       
  downloadQRCode ,
  getQRCodeCount,
  generateQRCodesForParent,
  revokeQRCode
} = require('../controllers/qrController');
const { verifyToken, allowRoles } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;

router.get('/download', downloadQRCode); 

router.use(verifyToken);
router.use(allowRoles(['admin', 'super-admin', "parent"]));
router.use((req, res, next) => {
  if (req.user.role === 'admin' || req.user.school_id) {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
});
router.use(requireFeature('qr_verification'));
// GET all QR codes for this user
router.get('/', getAllQRCodesForUser);
router.post('/admin/parents/generate', generateQRCodesForParent);
router.get('/admin/parents', generateQRCodesForParent);
router.patch('/:id/revoke', revokeQRCode);

router.get('/count', getQRCodeCount );
router.post('/generate', generateQRCodes);    

module.exports = router;
