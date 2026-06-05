const asyncHandler = require('../../shared/middlewares/asyncHandler');
const transactionService = require('./transaction.service');
const customerService = require('../customers/customer.service');

// POST /api/customers/:id/payments (manual)
const recordPayment = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.businessId);
  const payment = await transactionService.createManualPayment(customer._id, req.body, req.businessId);
  res.status(201).json({ success: true, data: payment });
});

module.exports = { recordPayment };

