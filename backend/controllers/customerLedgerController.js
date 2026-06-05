const asyncHandler = require('../middleware/asyncHandler');
const customerService = require('../services/customerService');
const transactionService = require('../services/transactionService');

// @desc    Get customer ledger (transactions + running balance)
// @route   GET /api/customers/:id/ledger
const getCustomerLedger = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.businessId);
  const ledger = await transactionService.getCustomerLedger(customer._id, req.businessId);
  res.json({ success: true, data: { customer, ...ledger } });
});

// @desc    Create generic transaction
// @route   POST /api/customers/:id/transactions
const createTransaction = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.businessId);
  const txn = await transactionService.createTransaction(customer._id, req.body, req.businessId);
  res.status(201).json({ success: true, data: txn });
});

// @desc    Record manual payment
// @route   POST /api/customers/:id/payments
const recordPayment = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.businessId);
  const payment = await transactionService.createManualPayment(customer._id, req.body, req.businessId);
  res.status(201).json({ success: true, data: payment });
});

module.exports = { getCustomerLedger, createTransaction, recordPayment };

