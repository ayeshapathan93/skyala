const asyncHandler = require('../utils/asyncHandler');
const customerService = require('../services/customer.service');

exports.create = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.businessId);
  res.status(201).json({ success: true, data: customer });
});

exports.list = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query, req.businessId);
  res.json({ success: true, ...result });
});

exports.search = asyncHandler(async (req, res) => {
  const data = await customerService.searchCustomers(req.query.q, req.businessId);
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.businessId);
  res.json({ success: true, data: customer });
});

exports.update = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.businessId);
  res.json({ success: true, data: customer });
});

exports.remove = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id, req.businessId);
  res.json({ success: true, message: 'Customer deleted' });
});

exports.history = asyncHandler(async (req, res) => {
  const result = await customerService.getCustomerHistory(req.params.id, req.businessId, req.query);
  res.json({ success: true, data: result });
});

exports.settleCredit = asyncHandler(async (req, res) => {
  const billService = require('../services/bill.service');
  const result = await billService.settleCredit(req.params.id, req.body, req.businessId);
  res.json({ success: true, data: result });
});
