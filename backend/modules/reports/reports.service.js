const mongoose = require('mongoose');
const Invoice = require('../invoices/invoice.model');
const Transaction = require('../transactions/transaction.model');
const Product = require('../inventory/product.model');

const monthKey = (dateField) => ({
  $dateToString: { format: '%Y-%m', date: dateField },
});

const monthLabel = (keyExpr) => keyExpr; // keep YYYY-MM for UI sorting; frontend can format to "Jan"

const buildInvoiceMatch = (businessId, dateMatch) => {
  const match = { businessId: new mongoose.Types.ObjectId(businessId) };
  if (dateMatch && Object.keys(dateMatch).length) match.createdAt = dateMatch;
  return match;
};

const buildTxnMatch = (businessId, dateMatch) => {
  const match = { businessId: new mongoose.Types.ObjectId(businessId) };
  if (dateMatch && Object.keys(dateMatch).length) match.date = dateMatch;
  return match;
};

const getSummary = async ({ businessId, dateMatch }) => {
  const [invAgg, returnsAgg, profitAgg] = await Promise.all([
    Invoice.aggregate([
      { $match: buildInvoiceMatch(businessId, dateMatch) },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalGST: { $sum: '$gstAmount' },
          totalDiscount: { $sum: '$discount' },
          totalInvoices: { $sum: 1 },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { ...buildTxnMatch(businessId, dateMatch), type: 'return' } },
      { $group: { _id: null, totalReturns: { $sum: '$debit' } } },
    ]),
    Invoice.aggregate([
      { $match: buildInvoiceMatch(businessId, dateMatch) },
      { $unwind: '$items' },
      {
        $lookup: {
          from: Product.collection.name,
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          grossProfit: {
            $sum: {
              $multiply: [
                { $subtract: ['$items.price', { $ifNull: ['$product.purchasePrice', 0] }] },
                '$items.quantity',
              ],
            },
          },
        },
      },
    ]),
  ]);

  const inv = invAgg[0] || { totalRevenue: 0, totalGST: 0, totalDiscount: 0, totalInvoices: 0 };
  const returns = returnsAgg[0] || { totalReturns: 0 };
  const profit = profitAgg[0] || { grossProfit: 0 };

  const avgOrderValue = inv.totalInvoices ? inv.totalRevenue / inv.totalInvoices : 0;

  return {
    totalRevenue: inv.totalRevenue || 0,
    totalGST: inv.totalGST || 0,
    totalProfit: profit.grossProfit || 0,
    avgOrderValue,
    totalReturns: returns.totalReturns || 0,
  };
};

const getRevenueChart = async ({ businessId, dateMatch }) => {
  const rows = await Invoice.aggregate([
    { $match: buildInvoiceMatch(businessId, dateMatch) },
    { $group: { _id: monthKey('$createdAt'), revenue: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: monthLabel('$_id'), revenue: 1 } },
  ]);
  return rows;
};

const getTopProducts = async ({ businessId, dateMatch, limit = 5 }) => {
  const rows = await Invoice.aggregate([
    { $match: buildInvoiceMatch(businessId, dateMatch) },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        category: { $first: '$items.category' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    { $project: { _id: 0, productId: '$_id', name: 1, category: 1, totalQuantity: 1, totalRevenue: 1 } },
  ]);
  return rows;
};

const getCategorySales = async ({ businessId, dateMatch }) => {
  const rows = await Invoice.aggregate([
    { $match: buildInvoiceMatch(businessId, dateMatch) },
    { $unwind: '$items' },
    {
      $group: {
        _id: { $ifNull: ['$items.category', 'Uncategorized'] },
        revenue: { $sum: '$items.total' },
      },
    },
    { $sort: { revenue: -1 } },
    { $project: { _id: 0, category: '$_id', revenue: 1 } },
  ]);
  return rows;
};

const getMonthlyBreakdown = async ({ businessId, dateMatch }) => {
  const rows = await Invoice.aggregate([
    { $match: buildInvoiceMatch(businessId, dateMatch) },
    {
      $group: {
        _id: monthKey('$createdAt'),
        totalOrders: { $sum: 1 },
        grossRevenue: { $sum: '$totalAmount' },
        discount: { $sum: '$discount' },
        gst: { $sum: '$gstAmount' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        month: monthLabel('$_id'),
        totalOrders: 1,
        grossRevenue: 1,
        discount: 1,
        gst: 1,
        netRevenue: '$grossRevenue',
      },
    },
  ]);
  return rows;
};

const getGst = async ({ businessId, dateMatch }) => {
  const agg = await Invoice.aggregate([
    { $match: buildInvoiceMatch(businessId, dateMatch) },
    { $group: { _id: null, totalGST: { $sum: '$gstAmount' } } },
  ]);
  const totalGST = agg[0]?.totalGST || 0;
  return { cgst: totalGST / 2, sgst: totalGST / 2, totalGST };
};

module.exports = {
  getSummary,
  getRevenueChart,
  getTopProducts,
  getCategorySales,
  getMonthlyBreakdown,
  getGst,
};

