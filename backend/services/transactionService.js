const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const computeRunningBalances = (transactions) => {
  let balance = 0;
  return transactions.map((t) => {
    balance = balance + (t.debit || 0) - (t.credit || 0);
    return { ...t, runningBalance: balance };
  });
};

const getCustomerLedger = async (customerId, businessId) => {
  const txns = await Transaction.find({ businessId, customerId })
    .sort({ date: 1, _id: 1 })
    .lean();

  const withRunning = computeRunningBalances(txns);
  const totals = withRunning.reduce(
    (acc, t) => {
      acc.totalDebit += t.debit || 0;
      acc.totalCredit += t.credit || 0;
      if (t.type === 'invoice') acc.totalBills += 1;
      return acc;
    },
    { totalDebit: 0, totalCredit: 0, totalBills: 0 }
  );

  const outstanding = totals.totalDebit - totals.totalCredit;
  const lastActivity = withRunning.length ? withRunning[withRunning.length - 1].date : null;

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const overdueBalanceAtCutoff = (() => {
    let bal = 0;
    for (const t of withRunning) {
      bal = bal + (t.debit || 0) - (t.credit || 0);
      if (new Date(t.date) > cutoff) break;
    }
    return bal;
  })();
  const overdueAmount = Math.max(0, overdueBalanceAtCutoff);

  return {
    transactions: withRunning,
    summary: {
      ...totals,
      outstanding,
      overdueAmount,
      lastActivity,
    },
  };
};

const createTransaction = async (customerId, payload, businessId) => {
  return await Transaction.create({
    ...payload,
    customerId,
    businessId,
  });
};

const createManualPayment = async (customerId, payload, businessId) => {
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error('Amount must be greater than 0');
    err.statusCode = 400;
    throw err;
  }

  const date = payload.date ? new Date(payload.date) : new Date();
  if (Number.isNaN(date.getTime())) {
    const err = new Error('Invalid date');
    err.statusCode = 400;
    throw err;
  }

  return await Transaction.create({
    customerId,
    businessId,
    date,
    type: 'payment',
    reference: payload.referenceId || payload.reference || '',
    description: payload.notes || payload.description || '',
    debit: 0,
    credit: amount,
    paymentMethod: payload.paymentMethod || 'Cash',
    paymentSource: 'manual',
  });
};

const getCustomerSummaries = async (businessId, customerIds) => {
  const ids = (customerIds || []).map((id) => new mongoose.Types.ObjectId(id));
  if (!ids.length) return new Map();

  const rows = await Transaction.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId), customerId: { $in: ids } } },
    {
      $group: {
        _id: '$customerId',
        totalDebit: { $sum: '$debit' },
        totalCredit: { $sum: '$credit' },
        lastActivity: { $max: '$date' },
        totalBills: {
          $sum: {
            $cond: [{ $eq: ['$type', 'invoice'] }, 1, 0],
          },
        },
      },
    },
  ]);

  const map = new Map();
  for (const r of rows) {
    map.set(String(r._id), {
      totalDebit: r.totalDebit || 0,
      totalCredit: r.totalCredit || 0,
      outstanding: (r.totalDebit || 0) - (r.totalCredit || 0),
      lastActivity: r.lastActivity || null,
      totalBills: r.totalBills || 0,
    });
  }
  return map;
};

module.exports = {
  computeRunningBalances,
  getCustomerLedger,
  createTransaction,
  createManualPayment,
  getCustomerSummaries,
};

