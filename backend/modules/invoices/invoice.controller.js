const asyncHandler = require('../../shared/middlewares/asyncHandler');
const invoiceService = require('./invoice.service');

// POST /api/invoices
const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body, req.businessId);
  res.status(201).json({ success: true, data: invoice });
});

// GET /api/invoices
const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await invoiceService.listInvoices(req.businessId);
  res.json({ success: true, count: invoices.length, data: invoices });
});

// GET /api/invoices/:id
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id, req.businessId);
  res.json({ success: true, data: invoice });
});

module.exports = { createInvoice, getInvoices, getInvoice };

