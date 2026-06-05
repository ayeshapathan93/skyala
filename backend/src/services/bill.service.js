const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const BillItem = require('../models/BillItem');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const Business = require('../models/Business');
const Customer = require('../models/Customer');
const AppError = require('../utils/appError');
const stockService = require('./stock.service');
const customerService = require('./customer.service');
const invoiceTemplate = require('../utils/invoiceTemplate');
const puppeteer = require('puppeteer');

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const buildBusinessSnapshot = (business = {}) => ({
  businessName: business.businessName || '',
  businessType: business.businessType || '',
  address: business.address || '',
  city: business.city || '',
  state: business.state || '',
  pincode: business.pincode || '',
  phone: business.phone || '',
  phone2: business.phone2 || '',
  gstNumber: business.gstNumber || '',
  termsAndConditions: business.termsAndConditions || '',
  thankYouMessage: business.thankYouMessage || '',
});

const buildCustomerSnapshot = (customer, payload = {}, customerId = null) => {
  const c = customer || {};
  return {
    customerId: customerId || c._id || null,
    customerName: c.name || payload.customerName || '',
    customerPhone: c.phone || payload.customerPhone || '',
    customerEmail: c.email || payload.customerEmail || '',
    customerAddress: c.address || payload.customerAddress || '',
    customerGST: c.gstNumber || payload.customerGST || '',
  };
};

const buildProductSnapshot = (product, item) => {
  const quantity = Number(item.quantity);
  const rate = Number(item.rate ?? product.sellingPrice);
  const productName = product.name || item.name || '';

  return {
    productId: product._id,
    name: productName,
    productName,
    sku: product.sku || '',
    barcode: product.barcode || '',
    category: product.category || '',
    unit: product.unit || item.unit || 'pcs',
    purchasePrice: Number(product.purchasePrice || 0),
    sellingPrice: Number(product.sellingPrice || 0),
    gstRate: Number(product.gstRate || 0),
    hsnCode: product.hsnCode || '',
    quantity,
    rate,
    total: roundMoney(quantity * rate),
  };
};

const addressFromBusiness = (business = {}) =>
  [business.address, business.city, business.state, business.pincode].filter(Boolean).join(', ');

const normalizeBillItem = (item = {}) => ({
  _id: item._id,
  productId: item.productId,
  productName: item.productName || item.name || '',
  name: item.name || item.productName || '',
  sku: item.sku || '',
  barcode: item.barcode || '',
  category: item.category || '',
  unit: item.unit || 'pcs',
  purchasePrice: Number(item.purchasePrice || 0),
  sellingPrice: Number(item.sellingPrice || item.rate || 0),
  gstRate: Number(item.gstRate || 0),
  hsnCode: item.hsnCode || '',
  quantity: Number(item.quantity || 0),
  rate: Number(item.rate || 0),
  total: Number(item.total || 0),
});

const toPrintableBill = (bill, items = []) => {
  const business = bill.businessSnapshot || {};
  const customer = bill.customerSnapshot || {};

  const customerSnapshot = {
    customerId: customer.customerId || bill.customerId || null,
    customerName: customer.customerName || bill.customerName || '',
    customerPhone: customer.customerPhone || bill.customerPhone || '',
    customerEmail: customer.customerEmail || bill.customerEmail || '',
    customerAddress: customer.customerAddress || bill.customerAddress || '',
    customerGST: customer.customerGST || bill.customerGST || '',
  };

  return {
    ...bill,
    customerId: customerSnapshot.customerId,
    customerName: customerSnapshot.customerName,
    customerPhone: customerSnapshot.customerPhone,
    customerEmail: customerSnapshot.customerEmail,
    customerAddress: customerSnapshot.customerAddress,
    customerGST: customerSnapshot.customerGST,
    business,
    customer: customerSnapshot,
    items: items.map(normalizeBillItem),
    termsAndConditions: business.termsAndConditions || bill.termsAndConditions || '',
    thankYouMessage: business.thankYouMessage || bill.thankYouMessage || '',
  };
};

let transactionSupport;

const supportsTransactions = async () => {
  if (transactionSupport !== undefined) return transactionSupport;
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    transactionSupport = Boolean(hello.setName || hello.msg === 'isdbgrid');
  } catch {
    transactionSupport = false;
  }
  return transactionSupport;
};

const withOptionalTransaction = async (work) => {
  if (!(await supportsTransactions())) {
    return work();
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const ensureBillingIndexes = async () => {
  let billIndexes = [];
  try {
    billIndexes = await Bill.collection.indexes();
  } catch (error) {
    if (error.codeName !== 'NamespaceNotFound') throw error;
  }
  const legacyBillNumberIndex = billIndexes.find(
    (index) => index.name === 'billNumber_1' && index.unique
  );

  if (legacyBillNumberIndex) {
    await Bill.collection.dropIndex('billNumber_1');
  }

  await Counter.createIndexes();
  await Bill.createIndexes();

  const existingInvoices = await Bill.find({
    invoiceNumber: { $regex: /^SKYLA-\d{4}-\d{6}$/ },
  })
    .select('businessId invoiceNumber')
    .lean();

  const maxByCounter = new Map();
  existingInvoices.forEach((bill) => {
    const match = /^SKYLA-(\d{4})-(\d{6})$/.exec(bill.invoiceNumber || '');
    if (!match || !bill.businessId) return;

    const year = Number(match[1]);
    const seq = Number(match[2]);
    const key = `${bill.businessId}:${year}`;
    const current = maxByCounter.get(key);
    if (!current || seq > current.seq) {
      maxByCounter.set(key, { businessId: bill.businessId, year, seq });
    }
  });

  await Promise.all(
    [...maxByCounter.values()].map((counter) =>
      Counter.findOneAndUpdate(
        { name: 'invoice', businessId: counter.businessId, year: counter.year },
        { $max: { seq: counter.seq } },
        { upsert: true, setDefaultsOnInsert: true }
      )
    )
  );
};

const computeTotals = (items, discountPercent, gstPercent) => {
  const subtotal = roundMoney(items.reduce((sum, it) => sum + it.quantity * it.rate, 0));
  const totalQty = roundMoney(items.reduce((sum, it) => sum + it.quantity, 0));
  const discountAmount = roundMoney((subtotal * discountPercent) / 100);
  const taxable = roundMoney(subtotal - discountAmount);
  const gstAmount = roundMoney((taxable * gstPercent) / 100);
  const totalAmount = roundMoney(taxable + gstAmount);

  return { subtotal, totalQty, discountAmount, gstAmount, totalAmount };
};

const resolvePaymentStatus = (totalAmount, receivedAmount, paymentType) => {
  if (receivedAmount >= totalAmount) return 'paid';
  if (receivedAmount > 0) return 'partial';
  return paymentType === 'credit' ? 'unpaid' : 'partial';
};

const createBill = async (payload, businessId) => {
  return withOptionalTransaction(async (session) => {
    let customerId = payload.customerId || null;

    const businessQuery = Business.findById(businessId).lean();
    if (session) businessQuery.session(session);
    const business = await businessQuery;
    if (!business) throw new AppError('Business not found', 404, 'BUSINESS_NOT_FOUND');
    const businessSnapshot = buildBusinessSnapshot(business);

    if (payload.saveCustomer && !customerId) {
      const created = await customerService.createCustomer(
        {
          name: payload.customerName,
          phone: payload.customerPhone,
          address: payload.customerAddress,
        },
        businessId,
        session
      );
      customerId = created._id;
    }

    let customer = null;
    if (customerId) {
      const customerQuery = Customer.findOne({ _id: customerId, businessId }).lean();
      if (session) customerQuery.session(session);
      customer = await customerQuery;
      if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      customerId = customer._id;
    }
    const customerSnapshot = buildCustomerSnapshot(customer, payload, customerId);

    const productIds = payload.items.map((it) => it.productId);
    const productQuery = Product.find({ businessId, _id: { $in: productIds } });
    if (session) productQuery.session(session);
    const products = await productQuery;
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const normalizedItems = payload.items.map((it) => {
      const product = productMap.get(String(it.productId));
      if (!product) throw new AppError(`Product not found: ${it.productId}`, 400, 'INVALID_PRODUCT');
      return buildProductSnapshot(product, it);
    });

    const discountPercent = Number(payload.discountPercent || 0);
    const gstPercent = Number(payload.gstPercent || 0);
    const totals = computeTotals(normalizedItems, discountPercent, gstPercent);

    const paymentType = payload.paymentType || 'cash';
    const receivedAmount = roundMoney(
      payload.receivedAmount === undefined || payload.receivedAmount === null
        ? paymentType === 'credit'
          ? 0
          : totals.totalAmount
        : payload.receivedAmount
    );
    if (receivedAmount > totals.totalAmount) {
      throw new AppError('Received amount cannot be greater than bill total', 400, 'INVALID_PAYMENT');
    }

    const balanceAmount = roundMoney(Math.max(0, totals.totalAmount - receivedAmount));
    const paymentStatus = resolvePaymentStatus(totals.totalAmount, receivedAmount, paymentType);

    const invoiceNumber = await Counter.getNextInvoiceNumber(businessId, session);

    const [bill] = await Bill.create(
      [
        {
          businessId,
          invoiceNumber,
          customerId,
          customerName: customerSnapshot.customerName,
          customerPhone: customerSnapshot.customerPhone,
          customerEmail: customerSnapshot.customerEmail,
          customerAddress: customerSnapshot.customerAddress,
          customerGST: customerSnapshot.customerGST,
          customerSnapshot,
          businessSnapshot,
          subtotal: totals.subtotal,
          totalQty: totals.totalQty,
          discountPercent,
          discountAmount: totals.discountAmount,
          gstPercent,
          gstAmount: totals.gstAmount,
          totalAmount: totals.totalAmount,
          receivedAmount,
          balanceAmount,
          paymentType,
          paymentStatus,
          dueDate: paymentType === 'credit' ? payload.dueDate || null : null,
          notes: payload.notes || '',
          billDate: payload.billDate || new Date(),
        },
      ],
      session ? { session } : undefined
    );

    await BillItem.insertMany(
      normalizedItems.map((it) => ({ ...it, billId: bill._id, businessId })),
      session ? { session } : undefined
    );

    for (const it of normalizedItems) {
      await stockService.adjustStock(
        it.productId,
        -Math.abs(it.quantity),
        businessId,
        { type: 'sale', note: `Bill ${invoiceNumber}`, billId: bill._id },
        session
      );
    }

    const itemQuery = BillItem.find({ billId: bill._id }).lean();
    if (session) itemQuery.session(session);
    const items = await itemQuery;
    return toPrintableBill(bill.toObject(), items);
  });
};

const listBills = async ({ q, paymentType, from, to, page, limit }, businessId) => {
  const filter = { businessId };

  if (q) {
    filter.$or = [
      { invoiceNumber: { $regex: q, $options: 'i' } },
      { customerName: { $regex: q, $options: 'i' } },
      { customerPhone: { $regex: q, $options: 'i' } },
    ];
  }

  if (paymentType && paymentType !== 'all') filter.paymentType = paymentType;
  if (from || to) {
    filter.billDate = {};
    if (from) filter.billDate.$gte = new Date(from);
    if (to) filter.billDate.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Bill.find(filter).sort({ billDate: -1 }).skip(skip).limit(limit).lean(),
    Bill.countDocuments(filter),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) || 1 };
};

const getBillById = async (id, businessId) => {
  const bill = await Bill.findOne({ _id: id, businessId }).lean();
  if (!bill) throw new AppError('Bill not found', 404, 'BILL_NOT_FOUND');

  const items = await BillItem.find({ billId: bill._id }).lean();
  return toPrintableBill(bill, items);
};

const getNextInvoicePreview = async (businessId) => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOne({ name: 'invoice', businessId, year }).lean();
  const nextSeq = (counter?.seq || 0) + 1;
  return `SKYLA-${year}-${String(nextSeq).padStart(6, '0')}`;
};

const buildInvoiceData = async (bill, businessId) => {
  const fallbackBusiness =
    bill.business && Object.keys(bill.business).length
      ? null
      : await Business.findById(businessId).lean();
  const business = bill.business || bill.businessSnapshot || buildBusinessSnapshot(fallbackBusiness || {});
  const items = bill.items || (await BillItem.find({ billId: bill._id }).lean());
  const customer = bill.customer || bill.customerSnapshot || {};

  const displayBillNumber = (() => {
    const raw = String(bill.invoiceNumber || '');
    const tail = raw.match(/(\d+)$/);
    return tail ? String(parseInt(tail[1], 10)) : raw;
  })();

  return {
    shopName: business.businessName,
    shopAddress: addressFromBusiness(business),
    shopPhone: business.phone,
    shopPhone2: business.phone2,
    billNumber: displayBillNumber,
    billNumberFull: bill.invoiceNumber,
    date: bill.billDate,
    customerName: customer.customerName || bill.customerName,
    customerPhone: customer.customerPhone || bill.customerPhone,
    customerAddress: customer.customerAddress || bill.customerAddress || '',
    items: items.map((item) => {
      const row = normalizeBillItem(item);
      const label = `${row.name} (${row.unit || 'pcs'})`;
      return {
        name: label.trim(),
        quantity: row.quantity,
        rate: row.rate,
        total: row.total,
      };
    }),
    totalQty: bill.totalQty,
    discountPercent: bill.discountPercent,
    gstPercent: bill.gstPercent,
    totalAmount: bill.totalAmount,
    receivedAmount: bill.receivedAmount,
    balanceAmount: bill.balanceAmount,
    paymentType: bill.paymentType,
    termsAndConditions: business.termsAndConditions,
    thankYouMessage: business.thankYouMessage,
  };
};

const generatePdf = async (bill, businessId) => {
  const invoiceData = await buildInvoiceData(bill, businessId);
  const html = invoiceTemplate(invoiceData);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => document.fonts?.ready);
    await new Promise((r) => setTimeout(r, 400));
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' },
    });
    if (!pdfBuffer || pdfBuffer.length < 100 || !pdfBuffer.slice(0, 5).toString().startsWith('%PDF')) {
      throw new Error('Generated PDF is invalid');
    }
    return { pdfBuffer, invoiceData, filename: `${bill.invoiceNumber}.pdf` };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};

const getCreditOutstanding = async (businessId) => {
  const rows = await Bill.aggregate([
    {
      $match: {
        businessId: new mongoose.Types.ObjectId(businessId),
        paymentType: 'credit',
        balanceAmount: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$customerId',
        customerName: { $first: { $ifNull: ['$customerSnapshot.customerName', '$customerName'] } },
        customerPhone: { $first: { $ifNull: ['$customerSnapshot.customerPhone', '$customerPhone'] } },
        totalOutstanding: { $sum: '$balanceAmount' },
        billCount: { $sum: 1 },
        oldestDue: { $min: '$dueDate' },
      },
    },
    { $sort: { totalOutstanding: -1 } },
  ]);

  return rows;
};

const settleCredit = async (customerId, { amount, note, billId }, businessId) => {
  return withOptionalTransaction(async (session) => {
    let remaining = roundMoney(amount);
    if (remaining <= 0) {
      throw new AppError('Settlement amount must be greater than zero', 400, 'VALIDATION_ERROR');
    }

    const filter = {
      businessId: new mongoose.Types.ObjectId(businessId),
      customerId: new mongoose.Types.ObjectId(customerId),
      balanceAmount: { $gt: 0 },
    };
    if (billId) filter._id = billId;

    const billQuery = Bill.find(filter).sort({ billDate: 1 });
    if (session) billQuery.session(session);
    const bills = await billQuery;

    if (!bills.length) {
      throw new AppError('No outstanding bills found for this customer', 404, 'NOT_FOUND');
    }

    for (const bill of bills) {
      if (remaining <= 0) break;
      const payment = Math.min(remaining, bill.balanceAmount);
      bill.receivedAmount = roundMoney(bill.receivedAmount + payment);
      bill.balanceAmount = roundMoney(bill.balanceAmount - payment);
      bill.paymentStatus = bill.balanceAmount <= 0 ? 'paid' : 'partial';
      await bill.save(session ? { session } : undefined);
      remaining = roundMoney(remaining - payment);
    }

    return { settled: roundMoney(amount - remaining), remainingCredit: remaining, note };
  });
};

module.exports = {
  createBill,
  listBills,
  getBillById,
  getNextInvoicePreview,
  buildInvoiceData,
  generatePdf,
  getCreditOutstanding,
  settleCredit,
  ensureBillingIndexes,
};
