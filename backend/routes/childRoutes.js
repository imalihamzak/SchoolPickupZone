const express = require('express');
const router = express.Router();
const {
  getChildren, getChild, addChild, updateChild, deleteChild
} = require('../controllers/childController');

const { verifyToken, allowRoles } = require('../middlewares/auth');

router.use(verifyToken);           // All routes below require valid token
router.use(allowRoles(['admin', 'parent']));

router.get('/', getChildren);
router.get('/:id', getChild);
router.post('/', addChild);
router.put('/:id', updateChild);
router.delete('/:id', deleteChild);

module.exports = router;
