const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/', dashboardController.getDashboard);
router.get('/notifications', dashboardController.getNotifications);
router.patch('/notifications/:id/read', dashboardController.markNotificationRead);
router.patch('/notifications/read-all', dashboardController.markAllNotificationsRead);

module.exports = router;
