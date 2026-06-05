const mongoose = require('mongoose');
const Expense = require('./expense.model');
const AppError = require('../../shared/utils/appError');

const buildMatch = (businessId, { dateMatch, category, search }) => {
  const match = { businessId: new mongoose.Types.ObjectId(businessId) };
  if (dateMatch && Object.keys(dateMatch).length) match.date = dateMatch;
  if (category) match.category = category;
  if (search) {
    match.$or = [
      { category: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { vendor: { $regex: search, $options: 'i' } },
    ];
  }
  return match;
};

const createExpense = async (payload, businessId) => {
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');

  const date = payload.date ? new Date(payload.date) : new Date();
  if (Number.isNaN(date.getTime())) throw new AppError('Invalid date', 400, 'INVALID_DATE');

  const created = await Expense.create({
    businessId,
    date,
    amount,
    category: String(payload.category || '').trim(),
    description: String(payload.description || payload.notes || '').trim(),
    vendor: String(payload.vendor || '').trim(),
    paymentMethod: payload.paymentMethod || 'cash',
    status: payload.status || 'paid',
  });
  return created;
};

const listExpenses = async ({ dateMatch, category, search }, businessId) => {
  const rows = await Expense.find(buildMatch(businessId, { dateMatch, category, search }))
    .sort({ date: -1, _id: -1 })
    .lean();
  return rows;
};

const getSummary = async ({ dateMatch }, businessId) => {
  const now = new Date();
  const thisMonthFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const lastMonthFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [thisMonthAgg, lastMonthAgg, pendingAgg, largestCategoryAgg] = await Promise.all([
    Expense.aggregate([
      { $match: buildMatch(businessId, { dateMatch: { $gte: thisMonthFrom, $lte: thisMonthTo } }) },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: buildMatch(businessId, { dateMatch: { $gte: lastMonthFrom, $lte: lastMonthTo } }) },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { ...buildMatch(businessId, { dateMatch }), status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: buildMatch(businessId, { dateMatch }) },
      { $group: { _id: { $ifNull: ['$category', 'Uncategorized'] }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, category: '$_id', total: 1 } },
    ]),
  ]);

  const thisMonthTotal = thisMonthAgg[0]?.total || 0;
  const lastMonthTotal = lastMonthAgg[0]?.total || 0;
  const pendingTotal = pendingAgg[0]?.total || 0;
  const largestCategory = largestCategoryAgg[0] || { category: '—', total: 0 };

  const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const avgDailyExpense = daysInThisMonth ? thisMonthTotal / daysInThisMonth : 0;

  return {
    thisMonthTotal,
    lastMonthTotal,
    avgDailyExpense,
    pendingReimbursements: pendingTotal,
    largestCategory: largestCategory.category,
  };
};

const getTrend = async (businessId) => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const rows = await Expense.aggregate([
    { $match: buildMatch(businessId, { dateMatch: { $gte: from, $lte: now } }) },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: '$_id', total: 1 } },
  ]);
  return rows;
};

const getCategoryBreakdown = async ({ dateMatch }, businessId) => {
  const rows = await Expense.aggregate([
    { $match: buildMatch(businessId, { dateMatch }) },
    {
      $group: {
        _id: { $cond: [{ $and: [{ $ne: ['$category', null] }, { $ne: ['$category', ''] }] }, '$category', 'Uncategorized'] },
        amount: { $sum: '$amount' },
      },
    },
    { $sort: { amount: -1 } },
    { $project: { _id: 0, category: '$_id', amount: 1 } },
  ]);
  return rows;
};

module.exports = { createExpense, listExpenses, getSummary, getTrend, getCategoryBreakdown };

