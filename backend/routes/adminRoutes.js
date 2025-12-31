const express = require('express');
const { getAllParents, getParentsAndGuards, generateDeviceLink, updateUser, deleteUser } = require('../controllers/adminController');
const { verifyToken, allowRoles, allowOnly } = require('../middlewares/auth');


const router = express.Router();

router.get('/parents', verifyToken, allowRoles(['admin', 'super-admin']), getAllParents);

router.get('/users', verifyToken, allowRoles(['admin', 'super-admin']), getParentsAndGuards);
router.post('/generate-device-link', verifyToken, allowRoles(['admin']), generateDeviceLink);
router.put('/parentguard/:id', verifyToken, allowOnly('admin'), updateUser);
router.delete('/parentguard/:id', verifyToken, allowOnly('admin'), deleteUser);



module.exports = router;
