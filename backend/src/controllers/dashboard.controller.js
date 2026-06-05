const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');
const notificationService = require('../services/notification.service');

exports.getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.businessId);
  res.json({ success: true, data });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.businessId, req.query);
  res.json({ success: true, ...result });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAsRead(req.params.id, req.businessId);
  res.json({ success: true, data });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.businessId);
  res.json({ success: true, message: 'All notifications marked as read' });
});
