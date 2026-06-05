const asyncHandler = require('../utils/asyncHandler');
const billService = require('../services/bill.service');
const invoiceTemplate = require('../utils/invoiceTemplate');

exports.create = asyncHandler(async (req, res) => {
  const bill = await billService.createBill(req.body, req.businessId);
  res.status(201).json({ success: true, data: bill });
});

exports.list = asyncHandler(async (req, res) => {
  const result = await billService.listBills(req.query, req.businessId);
  res.json({ success: true, ...result });
});

exports.getById = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(req.params.id, req.businessId);
  res.json({ success: true, data: bill });
});

exports.previewNumber = asyncHandler(async (req, res) => {
  const invoiceNumber = await billService.getNextInvoicePreview(req.businessId);
  res.json({ success: true, data: { invoiceNumber } });
});

exports.getHtml = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(req.params.id, req.businessId);
  const invoiceData = await billService.buildInvoiceData(bill, req.businessId);
  const origins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .join(' ');
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `frame-ancestors 'self' ${origins}`,
  });
  res.removeHeader('X-Frame-Options');
  res.send(invoiceTemplate(invoiceData));
});

exports.downloadPdf = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(req.params.id, req.businessId);
  const { pdfBuffer, filename } = await billService.generatePdf(bill, req.businessId);
  
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': pdfBuffer.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(pdfBuffer);
});

exports.creditOutstanding = asyncHandler(async (req, res) => {
  const data = await billService.getCreditOutstanding(req.businessId);
  res.json({ success: true, data });
});
