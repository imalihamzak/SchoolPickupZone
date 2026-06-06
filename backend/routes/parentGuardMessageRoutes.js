const express = require('express');
const {
  acknowledgeParentGuardMessage,
  getParentGuardMessages,
  sendParentGuardMessage,
} = require('../controllers/parentGuardMessageController');
const { verifyToken, allowOnly, allowRoles } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;

const router = express.Router();

router.use(verifyToken);
router.use(allowRoles(['parent', 'guard']));
router.use(checkSubscriptionStatus);
router.use(requireFeature('qr_verification'));

router.post('/', allowOnly('parent'), sendParentGuardMessage);
router.get('/', getParentGuardMessages);
router.patch('/:id/acknowledge', allowOnly('guard'), acknowledgeParentGuardMessage);

module.exports = router;
