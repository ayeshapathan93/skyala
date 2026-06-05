const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const BillItem = require('../models/BillItem');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const notificationService = require('./notification.service');
const billService = require('./bill.service');

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getDashboard = async (businessId) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const businessObjectId = new mongoose.Types.ObjectId(businessId);

  const [
    totalCustomers,
    totalProducts,
    totalSalesAgg,
    dailySalesAgg,
    weeklySalesAgg,
    monthlySalesAgg,
    revenueTrend,
    topProducts,
    lowStockProducts,
    customerGrowth,
    creditOutstanding,
    recentBills,
    unreadNotifications,
  ] = await Promise.all([
    Customer.countDocuments({ businessId }),
    Product.countDocuments({ businessId }),
    Bill.aggregate([
      { $match: { businessId: businessObjectId } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { businessId: businessObjectId, billDate: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { businessId: businessObjectId, billDate: { $gte: weekStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { businessId: businessObjectId, billDate: { $gte: monthStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { businessId: businessObjectId, billDate: { $gte: weekStart, $lte: todayEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    BillItem.aggregate([
      {
        $lookup: {
          from: 'bills',
          localField: 'billId',
          foreignField: '_id',
          as: 'bill',
        },
      },
      { $unwind: '$bill' },
      { $match: { 'bill.businessId': businessObjectId, 'bill.billDate': { $gte: monthStart } } },
      {
        $group: {
          _id: '$productId',
          name: { $first: '$name' },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$total' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]),
    notificationService.getLowStockProducts(businessId, 10),
    Customer.aggregate([
      { $match: { businessId: businessObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]),
    billService.getCreditOutstanding(businessId),
    Bill.find({ businessId }).sort({ billDate: -1 }).limit(8).lean(),
    notificationService.listNotifications(businessId, { unreadOnly: true, limit: 5 }),
  ]);

  const pick = (agg) => ({ total: agg[0]?.total || 0, count: agg[0]?.count || 0 });

  return {
    totalCustomers,
    totalProducts,
    totalSales: pick(totalSalesAgg),
    dailySales: pick(dailySalesAgg),
    weeklySales: pick(weeklySalesAgg),
    monthlySales: pick(monthlySalesAgg),
    revenueTrend,
    topProducts,
    lowStockProducts,
    customerGrowth,
    creditOutstanding,
    recentBills,
    notifications: unreadNotifications.data,
  };
};

module.exports = { getDashboard };
