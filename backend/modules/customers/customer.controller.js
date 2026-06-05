const asyncHandler = require('../../shared/middlewares/asyncHandler');
const customerService = require('./customer.service');

// POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.businessId);
  res.status(201).json({ success: true, data: customer });
});

// GET /api/customers?q=...
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await customerService.listCustomers({ q: req.query.q }, req.businessId);
  res.json({ success: true, count: customers.length, data: customers });
});

// GET /api/customers/:id
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.businessId);
  res.json({ success: true, data: customer });
});

module.exports = { createCustomer, getCustomers, getCustomer };

