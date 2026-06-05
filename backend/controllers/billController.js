const asyncHandler = require('../middleware/asyncHandler');
const billService = require('../services/billService');

// @desc    Create bill
// @route   POST /api/bills
const createBill = asyncHandler(async (req, res) => {
  const bill = await billService.createBill(req.body, req.businessId);
  res.status(201).json({ success: true, data: bill });
});

// @desc    Get all bills
// @route   GET /api/bills
const getBills = asyncHandler(async (req, res) => {
  const bills = await billService.getAllBills(req.businessId);
  res.json({ success: true, count: bills.length, data: bills });
});

// @desc    Get single bill
// @route   GET /api/bills/:id
const getBill = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(req.params.id, req.businessId);
  res.json({ success: true, data: bill });
});

// @desc    Get bills by customer
// @route   GET /api/bills/customer/:customerId
const getBillsByCustomer = asyncHandler(async (req, res) => {
  const bills = await billService.getBillsByCustomer(req.params.customerId, req.businessId);
  res.json({ success: true, count: bills.length, data: bills });
});

module.exports = { createBill, getBills, getBill, getBillsByCustomer };
