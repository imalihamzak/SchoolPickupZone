const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, allowRoles } = require('../middlewares/auth');

router.post(
    '/subscribe/create-session',
    verifyToken,
    allowRoles(['admin', 'super-admin']),
    (req, res, next) => {
      console.log('AUTH PASSED', req.user);
      next();
    },
    subscriptionController.createCheckoutSession
  );
  

module.exports = router;
