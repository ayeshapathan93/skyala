const asyncHandler = require('../middleware/asyncHandler');
const customerService = require('../services/customerService');

// @desc    Create customer
// @route   POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.businessId);
  res.status(201).json({ success: true, data: customer });
});

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = asyncHandler(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const customers = await customerService.getAllCustomers(req.businessId, q);
  res.json({ success: true, count: customers.length, data: customers });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.businessId);
  res.json({ success: true, data: customer });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.businessId);
  res.json({ success: true, data: customer });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id, req.businessId);
  res.json({ success: true, message: 'Customer deleted successfully' });
});

module.exports = { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer };
