const fs = require('fs');
const path = require('path');
const asyncHandler = require('../middleware/asyncHandler');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'invoices.json');

const readInvoices = () => {
  try {
    if (!fs.existsSync(dataFile)) return [];
    const raw = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (_) {
    return [];
  }
};

const normalizeName = (name) => String(name || '').trim();

exports.getCustomerSummary = asyncHandler(async (req, res) => {
  const invoices = readInvoices();
  const customerName = normalizeName(req.query.customerName);

  const byCustomer = new Map();
  for (const inv of invoices) {
    const name = normalizeName(inv.customerName);
    if (!name) continue;

    const dateMs = new Date(inv.date || 0).getTime() || 0;
    const balance = Number.isFinite(Number(inv.balance)) ? Number(inv.balance) : 0;
    const paidAmount = Number.isFinite(Number(inv.paidAmount)) ? Number(inv.paidAmount) : 0;

    const prev = byCustomer.get(name) || {
      customerName: name,
      totalDueAmount: 0,
      lastPayment: 0,
      lastPaymentDate: null,
    };

    prev.totalDueAmount += balance;
    if (!prev.lastPaymentDate || dateMs > new Date(prev.lastPaymentDate).getTime()) {
      prev.lastPayment = paidAmount;
      prev.lastPaymentDate = inv.date || null;
    }

    byCustomer.set(name, prev);
  }

  if (customerName) {
    const summary = byCustomer.get(customerName) || {
      customerName,
      totalDueAmount: 0,
      lastPayment: 0,
      lastPaymentDate: null,
    };
    return res.json({ success: true, summary });
  }

  const summaries = Array.from(byCustomer.values()).sort((a, b) =>
    a.customerName.localeCompare(b.customerName)
  );
  res.json({ success: true, summaries });
});

