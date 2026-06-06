const express = require('express');
const router = express.Router();
const {
  getGuardians,
  getGuardian,
  addGuardian,
  updateGuardian,
  deleteGuardian,
  getSecondParents,
  addSecondParent,
  updateSecondParent,
  deleteSecondParent
} = require('../controllers/guardianController');

const { verifyToken, allowRoles } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');
const { requireFeature } = checkSubscriptionStatus;

router.use(verifyToken);           // All routes below require valid token
router.use(allowRoles(['admin', 'parent']));
router.use((req, res, next) => {
  if (req.user.school_id) {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
});
router.use(requireFeature('guardian_management'));

router.get('/second-parents', getSecondParents);
router.post('/second-parents', addSecondParent);
router.put('/second-parents/:id', updateSecondParent);
router.delete('/second-parents/:id', deleteSecondParent);

router.get('/', getGuardians);
router.get('/:id', getGuardian);
router.post('/', addGuardian);
router.put('/:id', updateGuardian);
router.delete('/:id', deleteGuardian);

module.exports = router;
