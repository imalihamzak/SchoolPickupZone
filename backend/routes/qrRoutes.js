const express = require('express');
const router = express.Router();
const { 
  getAllQRCodesForUser, 
  generateQRCodes,       
  downloadQRCode ,
  getQRCodeCount,
  generateQRCodesForParent        
} = require('../controllers/qrController');
const { verifyToken, allowRoles } = require('../middlewares/auth');

router.get('/download', downloadQRCode); 

router.use(verifyToken);
router.use(allowRoles(['admin', 'super-admin', "parent"]));
// GET all QR codes for this user
router.get('/', getAllQRCodesForUser);
router.get('/admin/parents', generateQRCodesForParent);

router.get('/count', getQRCodeCount );
router.post('/generate', generateQRCodes);    

module.exports = router;
