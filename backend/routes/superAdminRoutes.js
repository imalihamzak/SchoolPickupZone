const express = require('express');
const router = express.Router();
const { verifyToken, allowOnly, allowRoles } = require('../middlewares/auth');
const {
  getAllSchools,
  createSchool,
  updateSchool,
  updateSchoolStatus,
  deleteSchool,
  getAllAdmins,
  createAdmin,
  resendAdminInvite,
  updateAdmin,
  deleteAdmin,
  getAllPayments, getAllSubscriptions, createPlan, deletePlan, updatePlan, getAllPlans, getAdminById, cancelSubscription, reactivateSubscription, changeSubscriptionPlan, getOverviewStats, getDashboardStats
} = require('../controllers/superAdminController');
const { getInvoiceRetries, processDueInvoiceRetries } = require('../controllers/subscriptionController');
const { getSuperAdminAuditLogs } = require('../controllers/auditController');
const { auditAction } = require('../services/auditLogService');

router.use(verifyToken, allowRoles(['super-admin', "admin"]));

// Schools
router.get('/schools', allowOnly('super-admin'), getAllSchools);
router.post('/schools', allowOnly('super-admin'), auditAction({
  action: 'school.create',
  entityType: 'school',
  getEntityName: (req) => req.body?.name,
}), createSchool);
router.put('/schools/:id', allowOnly('super-admin'), auditAction({
  action: 'school.update',
  entityType: 'school',
  getEntityName: (req) => req.body?.name,
}), updateSchool);
router.patch('/schools/:id/status', allowOnly('super-admin'), auditAction({
  getAction: (req) => req.body?.status === 'Suspended' ? 'school.suspend' : 'school.reactivate',
  entityType: 'school',
}), updateSchoolStatus);
router.delete('/schools/:id', allowOnly('super-admin'), auditAction({
  action: 'school.delete',
  entityType: 'school',
}), deleteSchool);

// Admins
router.get('/admins', allowOnly('super-admin'), getAllAdmins);
router.get('/admins/:id', allowOnly('super-admin'), getAdminById);
router.post('/admins', allowOnly('super-admin'), auditAction({
  action: 'admin.create',
  entityType: 'admin',
  getEntityName: (req) => req.body?.email,
}), createAdmin);
router.post('/admins/:id/resend-invite', allowOnly('super-admin'), auditAction({
  action: 'admin.resend_invite',
  entityType: 'admin',
  getEntityName: (_req, responseBody) => responseBody?.email,
}), resendAdminInvite);
router.put('/admins/:id', allowOnly('super-admin'), auditAction({
  action: 'admin.update',
  entityType: 'admin',
  getEntityName: (req) => req.body?.email,
}), updateAdmin);
router.delete('/admins/:id', allowOnly('super-admin'), auditAction({
  action: 'admin.delete',
  entityType: 'admin',
}), deleteAdmin);



// Subscription plan management
router.get('/plans', verifyToken, allowRoles(['super-admin',"admin"]), getAllPlans);
router.post('/plans', verifyToken, allowOnly('super-admin'), auditAction({
  action: 'package.create',
  entityType: 'package',
  getEntityName: (req) => req.body?.name,
}), createPlan);
router.put('/plans/:id', verifyToken, allowOnly('super-admin'), auditAction({
  action: 'package.update',
  entityType: 'package',
  getEntityName: (req) => req.body?.name,
}), updatePlan);
router.delete('/plans/:id', verifyToken, allowOnly('super-admin'), auditAction({
  action: 'package.delete',
  entityType: 'package',
}), deletePlan);

// Subscription & payment info
router.get('/subscriptions', verifyToken, allowOnly('super-admin'),getAllSubscriptions);
router.get('/payments', verifyToken, allowOnly('super-admin'),getAllPayments);
router.put('/subscriptions/:id/cancel', verifyToken, allowOnly('super-admin'), auditAction({
  action: 'subscription.cancel',
  entityType: 'subscription',
}), cancelSubscription);
router.put('/subscriptions/:id/reactivate', verifyToken, allowOnly('super-admin'), auditAction({
  action: 'subscription.reactivate',
  entityType: 'subscription',
}), reactivateSubscription);
router.put('/subscriptions/:id/change-plan', verifyToken, allowOnly('super-admin'), auditAction({
  action: 'subscription.change_plan',
  entityType: 'subscription',
}), changeSubscriptionPlan);
router.get('/billing/retries', verifyToken, allowOnly('super-admin'), getInvoiceRetries);
router.post('/billing/process-retries', verifyToken, allowOnly('super-admin'), auditAction({
  action: 'billing.process_retries',
  entityType: 'billing_retry',
  getEntityId: (_req, responseBody) => responseBody?.processed ?? null,
  getEntityName: (_req, responseBody) => `${responseBody?.processed || 0} retry attempts`,
}), processDueInvoiceRetries);
router.get('/audit-logs', verifyToken, allowOnly('super-admin'), getSuperAdminAuditLogs);
router.get('/overview', verifyToken, allowOnly('super-admin'), getOverviewStats);
router.get('/dashboard-stats', verifyToken, allowOnly('super-admin'), getDashboardStats);

module.exports = router;
