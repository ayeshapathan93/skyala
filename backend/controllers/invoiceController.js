const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const asyncHandler = require('../middleware/asyncHandler');
const invoiceTemplate = require('../utils/invoiceTemplate');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'invoices.json');

const ensureDataFile = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]), 'utf-8');
  }
};

const saveInvoice = (invoice) => {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, 'utf-8');
  const invoices = JSON.parse(raw || '[]');
  invoices.push(invoice);
  fs.writeFileSync(dataFile, JSON.stringify(invoices, null, 2), 'utf-8');
};

exports.generateInvoice = asyncHandler(async (req, res) => {
  const {
    shopName,
    shopAddress,
    shopGst,
    shopMobile,
    billNumber,
    date,
    customerName,
    customerPhone,
    customerAddress,
    items,
    subtotal: subtotalInput,
    totalQty: totalQtyInput,
    discount: discountInput,
    cgst: cgstInput,
    sgst: sgstInput,
    total,
    totalAmount,
    paidAmount: paidAmountInput,
    balance: balanceInput,
  } = req.body;

  if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Customer and item details are required' });
  }

  const money = (n) => Number(Number.isFinite(Number(n)) ? Number(n) : 0);
  const qtyNum = (n) => Number(Number.isFinite(Number(n)) ? Number(n) : 0);

  const safeItems = items.map((item) => {
    const qty = qtyNum(item.qty);
    const rate = money(item.rate);
    const discount = money(item.discount);
    const computedAmount = qty * rate * (1 - discount / 100);
    return {
      name: String(item.name ?? ''),
      hsn: String(item.hsn ?? ''),
      qty,
      unit: String(item.unit ?? 'pcs'),
      rate,
      discount,
      amount: money(item.amount ?? computedAmount),
    };
  });

  const subtotal = money(subtotalInput ?? safeItems.reduce((sum, it) => sum + it.qty * it.rate, 0));
  const totalQty = qtyNum(totalQtyInput ?? safeItems.reduce((sum, it) => sum + it.qty, 0));
  const discount = money(discountInput ?? safeItems.reduce((sum, it) => sum + (it.qty * it.rate * (it.discount || 0)) / 100, 0));
  const cgst = money(cgstInput);
  const sgst = money(sgstInput);
  const computedTotal = subtotal - discount + cgst + sgst;
  const finalTotal = money(totalAmount ?? total ?? computedTotal);
  const paidAmountSafe = money(paidAmountInput ?? 0);
  const balanceSafe = money(balanceInput ?? (finalTotal - paidAmountSafe));

  const billId = `BILL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`;
  const invoiceData = {
    billId,
    billNumber,
    date: date || new Date().toISOString(),
    shopName: shopName || 'My Shop',
    shopAddress: shopAddress || '',
    shopGst: shopGst || '',
    shopMobile: shopMobile || '',
    customerName,
    customerPhone: customerPhone || '',
    customerAddress: customerAddress || '',
    items: safeItems,
    subtotal,
    totalQty,
    discount,
    cgst,
    sgst,
    totalAmount: finalTotal,
    paidAmount: paidAmountSafe,
    balance: balanceSafe,
  };

  saveInvoice(invoiceData);

  const html = invoiceTemplate(invoiceData);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.emulateMediaType('screen');

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  });

  await browser.close();

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=invoice-${billId}.pdf`,
    'Content-Length': pdfBuffer.length,
    'X-Bill-Id': billId,
  });

  res.send(pdfBuffer);
});
