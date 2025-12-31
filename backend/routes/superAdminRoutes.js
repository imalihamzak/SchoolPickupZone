const express = require('express');
const router = express.Router();
const { verifyToken, allowOnly, allowRoles } = require('../middlewares/auth');
const {
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllPayments, getAllSubscriptions, createPlan, deletePlan, updatePlan, getAllPlans, getAdminById, cancelSubscription, getOverviewStats, getDashboardStats
} = require('../controllers/superAdminController');

router.use(verifyToken, allowRoles(['super-admin', "admin"]));

// Schools
router.get('/schools', getAllSchools);
router.post('/schools', createSchool);
router.put('/schools/:id', updateSchool);
router.delete('/schools/:id', deleteSchool);

// Admins
router.get('/admins', getAllAdmins);
router.get('/admins/:id', getAdminById);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);



// Subscription plan management
router.get('/plans', verifyToken, allowRoles(['super-admin',"admin"]), getAllPlans);
router.post('/plans', verifyToken, allowOnly('super-admin'), createPlan);
router.put('/plans/:id', verifyToken, allowOnly('super-admin'),updatePlan);
router.delete('/plans/:id', verifyToken, allowOnly('super-admin'), deletePlan);

// Subscription & payment info
router.get('/subscriptions', verifyToken, allowOnly('super-admin'),getAllSubscriptions);
router.get('/payments', verifyToken, allowOnly('super-admin'),getAllPayments);
router.put('/subscriptions/:id/cancel', verifyToken, allowOnly('super-admin'), cancelSubscription)
router.get('/overview', verifyToken, allowOnly('super-admin'), getOverviewStats);
router.get('/dashboard-stats', verifyToken, allowOnly('super-admin'), getDashboardStats);

module.exports = router;
