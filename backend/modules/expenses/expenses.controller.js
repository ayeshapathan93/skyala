const asyncHandler = require('../../shared/middlewares/asyncHandler');
const { parseDateRange } = require('../../shared/utils/dateRange');
const service = require('./expenses.service');

// POST /api/expenses
const createExpense = asyncHandler(async (req, res) => {
  const expense = await service.createExpense(req.body, req.businessId);
  res.status(201).json({ success: true, data: expense });
});

// GET /api/expenses?from&to&category&search
const listExpenses = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const data = await service.listExpenses({ dateMatch: match, category: category || undefined, search: search || undefined }, req.businessId);
  res.json({ success: true, count: data.length, data });
});

// GET /api/expenses/summary
const summary = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const data = await service.getSummary({ dateMatch: match }, req.businessId);
  res.json({ success: true, data });
});

// GET /api/expenses/trend
const trend = asyncHandler(async (req, res) => {
  const data = await service.getTrend(req.businessId);
  res.json({ success: true, data });
});

// GET /api/expenses/category-breakdown
const categoryBreakdown = asyncHandler(async (req, res) => {
  const { match } = parseDateRange(req.query);
  const data = await service.getCategoryBreakdown({ dateMatch: match }, req.businessId);
  res.json({ success: true, data });
});

module.exports = { createExpense, listExpenses, summary, trend, categoryBreakdown };

