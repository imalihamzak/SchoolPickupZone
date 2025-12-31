// routes/pickupRoutes.js
const express = require('express');
const { logPickup, getTodayStats, getWeeklyStats, getRecentPickups  } = require('../controllers/pickupController');

const router = express.Router();

router.post('/scan', logPickup);
router.get('/stats/today', getTodayStats);
router.get('/stats/week', getWeeklyStats);
router.get('/recent', getRecentPickups);

module.exports = router;
