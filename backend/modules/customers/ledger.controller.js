const asyncHandler = require('../../shared/middlewares/asyncHandler');
const customerService = require('./customer.service');
const transactionService = require('../transactions/transaction.service');

// GET /api/customers/:id/ledger
const getLedger = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.businessId);
  const ledger = await transactionService.getCustomerLedger(customer._id, req.businessId);
  res.json({ success: true, data: { customer, ...ledger } });
});

module.exports = { getLedger };

