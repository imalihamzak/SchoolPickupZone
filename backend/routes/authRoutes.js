const express = require('express');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  setPasswordFromToken,
  getPublicPlans,
  getPublicSchools,
  checkContactAvailability,
  requestEmailChangeCode,
  changePassword,
} = require('../controllers/authController');
const { verifyToken, allowOnly, allowRoles } = require('../middlewares/auth');
const pool = require('../config/db');

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/set-password', setPasswordFromToken); 
router.get('/plans', getPublicPlans);
router.get('/schools', getPublicSchools);
router.get('/availability', checkContactAvailability);

router.use(verifyToken);          
router.use(allowRoles(['admin', "parent", "super-admin", "guard"]));
router.get('/me', getProfile);
router.post('/request-email-change-code', requestEmailChangeCode);
router.put('/change-password', changePassword);
router.put('/update-profile', updateProfile);


module.exports = router;
