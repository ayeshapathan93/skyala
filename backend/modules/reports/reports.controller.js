const asyncHandler = require('../../shared/middlewares/asyncHandler');
const { parseDateRange } = require('../../shared/utils/dateRange');
const reportsService = require('./reports.service');

const summary = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const data = await reportsService.getSummary({ businessId: req.businessId, dateMatch: match });
  res.json({ success: true, data });
});

const revenueChart = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const data = await reportsService.getRevenueChart({ businessId: req.businessId, dateMatch: match });
  res.json({ success: true, data });
});

const topProducts = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const data = await reportsService.getTopProducts({ businessId: req.businessId, dateMatch: match, limit });
  res.json({ success: true, data });
});

const categorySales = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const data = await reportsService.getCategorySales({ businessId: req.businessId, dateMatch: match });
  res.json({ success: true, data });
});

const monthlyBreakdown = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const data = await reportsService.getMonthlyBreakdown({ businessId: req.businessId, dateMatch: match });
  res.json({ success: true, data });
});

const gst = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const data = await reportsService.getGst({ businessId: req.businessId, dateMatch: match });
  res.json({ success: true, data });
});

module.exports = { summary, revenueChart, topProducts, categorySales, monthlyBreakdown, gst };

