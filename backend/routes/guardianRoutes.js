const express = require('express');
const router = express.Router();
const {
  getGuardians,
  getGuardian,
  addGuardian,
  updateGuardian,
  deleteGuardian
} = require('../controllers/guardianController');

const { verifyToken, allowRoles } = require('../middlewares/auth');

router.use(verifyToken);           // All routes below require valid token
router.use(allowRoles(['admin', 'parent']));

router.get('/', getGuardians);
router.get('/:id', getGuardian);
router.post('/', addGuardian);
router.put('/:id', updateGuardian);
router.delete('/:id', deleteGuardian);

module.exports = router;
