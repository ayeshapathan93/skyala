const asyncHandler = require('../../shared/middlewares/asyncHandler');
const dashboardService = require('./dashboard.service');

// GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.businessId);
  res.json({ success: true, data: stats });
});

module.exports = { getDashboard };

