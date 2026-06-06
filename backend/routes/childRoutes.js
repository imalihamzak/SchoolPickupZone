const express = require('express');
const router = express.Router();
const {
  getChildren, getChild, addChild, updateChild, deleteChild
} = require('../controllers/childController');

const { verifyToken, allowRoles } = require('../middlewares/auth');
const checkSubscriptionStatus = require('../middlewares/checkSubscriptionStatus');

router.use(verifyToken);           // All routes below require valid token
router.use(allowRoles(['admin', 'parent']));
router.use((req, res, next) => {
  if (req.user.school_id) {
    return checkSubscriptionStatus(req, res, next);
  }
  next();
});

router.get('/', getChildren);
router.get('/:id', getChild);
router.post('/', addChild);
router.put('/:id', updateChild);
router.delete('/:id', deleteChild);

module.exports = router;
