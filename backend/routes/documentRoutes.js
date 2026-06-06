const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getUserDocuments,
  getSchoolDocuments,
  getDocumentVerificationStatus,
  downloadDocument,
  deleteDocument,
  verifyDocument,
  rejectDocument,
} = require('../controllers/documentController');
const { verifyToken, allowRoles } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { ensureStorageAvailable, requireFeature } = checkSubscriptionStatus;

router.use(verifyToken);
router.use(allowRoles(['admin', 'parent']));
router.use((req, res, next) => {
  if (req.user.school_id) {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
});
router.use(requireFeature('document_uploads'));

router.post('/', ensureStorageAvailable, uploadDocument);
router.get('/', getUserDocuments);
router.get('/school', getSchoolDocuments);
router.get('/verification-status', getDocumentVerificationStatus);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

router.post('/:id/verify',  verifyDocument);
router.post('/:id/reject',  rejectDocument);


module.exports = router;
