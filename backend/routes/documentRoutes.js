const express = require('express');
const router = express.Router();
const { uploadDocument, getUserDocuments, deleteDocument , verifyDocument, rejectDocument} = require('../controllers/documentController');
const { verifyToken, allowOnly, allowRoles } = require('../middlewares/auth');

router.use(verifyToken);
router.use(allowRoles(['admin', 'parent']));

router.post('/', uploadDocument);
router.get('/', getUserDocuments);
router.delete('/:id', deleteDocument);

router.post('/:id/verify',  verifyDocument);
router.post('/:id/reject',  rejectDocument);


module.exports = router;
