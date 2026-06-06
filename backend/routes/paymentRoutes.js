const express = require('express');
const { createCheckoutSession } = require('../controllers/paymentController');
const { verifyToken, allowRoles } = require('../middlewares/auth');

const router = express.Router();

router.post('/create-checkout-session', verifyToken, allowRoles(['admin', 'super-admin']), createCheckoutSession);

module.exports = router;
