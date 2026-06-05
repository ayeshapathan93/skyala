const mongoose = require('mongoose');
const Invoice = require('./invoice.model');
const AppError = require('../../shared/utils/appError');
const inventoryService = require('../inventory/product.service');
const Transaction = require('../transactions/transaction.model');
const Product = require('../inventory/product.model');

const computeSubTotal = (items) => items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);

const createInvoice = async (payload, businessId) => {
  if (!payload?.customerId) throw new AppError('customerId is required', 400, 'VALIDATION_ERROR');
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new AppError('items are required', 400, 'VALIDATION_ERROR');

  const productIds = items.map((it) => it.productId);
  const products = await Product.find({ businessId, _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const normalizedItems = items.map((it) => {
    const p = productMap.get(String(it.productId));
    if (!p) throw new AppError('Invalid productId in items', 400, 'INVALID_PRODUCT');
    const quantity = Number(it.quantity);
    const price = Number(it.price ?? p.sellingPrice);
    const total = price * quantity;
    return {
      productId: it.productId,
      name: it.name || p.name,
      category: it.category || p.category || '',
      quantity,
      price,
      total,
    };
  });

  const subTotal = computeSubTotal(normalizedItems);
  const discount = Number(payload.discount ?? 0);
  const gstAmount = Number(payload.gstAmount ?? 0);
  const totalAmount = Math.max(0, subTotal - discount + gstAmount);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    for (const it of normalizedItems) {
      await inventoryService.adjustStock(it.productId, -Math.abs(it.quantity), businessId, session);
    }

    const invoice = await Invoice.create(
      [
        {
          businessId,
          customerId: payload.customerId,
          items: normalizedItems,
          totalAmount,
          gstAmount,
          discount,
          status: payload.status || 'unpaid',
        },
      ],
      { session }
    );

    await Transaction.create(
      [
        {
          businessId,
          customerId: payload.customerId,
          date: payload.date ? new Date(payload.date) : new Date(),
          type: 'invoice',
          reference: payload.reference || `INV-${invoice[0]._id}`,
          description: payload.description || 'Invoice',
          debit: totalAmount,
          credit: 0,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return invoice[0];
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

const listInvoices = async (businessId) => {
  return await Invoice.find({ businessId }).sort({ createdAt: -1 }).lean();
};

const getInvoiceById = async (id, businessId) => {
  const invoice = await Invoice.findOne({ _id: id, businessId }).lean();
  if (!invoice) throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  return invoice;
};

module.exports = { createInvoice, listInvoices, getInvoiceById };
