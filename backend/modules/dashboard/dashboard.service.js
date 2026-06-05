const Customer = require('../customers/customer.model');
const Transaction = require('../transactions/transaction.model');
const mongoose = require('mongoose');

const getDashboardStats = async (businessId) => {
  const [totalCustomers, moneyAgg, recentTransactions] = await Promise.all([
    Customer.countDocuments({ businessId }),
    Transaction.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' },
        },
      },
    ]),
    Transaction.find({ businessId }).sort({ date: -1, _id: -1 }).limit(10).lean(),
  ]);

  const totals = moneyAgg[0] || { totalDebit: 0, totalCredit: 0 };
  const totalRevenue = totals.totalCredit || 0;
  const totalOutstanding = (totals.totalDebit || 0) - (totals.totalCredit || 0);

  return { totalCustomers, totalRevenue, totalOutstanding, recentTransactions };
};

module.exports = { getDashboardStats };
