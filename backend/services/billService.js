const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');
const Ledger = require('../models/Ledger');

/**
 * Creates a bill with atomic stock validation and deduction.
 * Uses a MongoDB session/transaction to ensure consistency.
 */
const createBill = async (billData, businessId) => {
  const { customerId, items, discount = 0, receivedAmount = 0, paymentType = 'cash' } = billData;

  if (!items || items.length === 0) {
    const err = new Error('Bill must contain at least one item');
    err.statusCode = 400;
    throw err;
  }

  // --- Start a session for atomicity ---
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- Validate customer inside the session (skip for walk-in customers) ---
    let customer = null;
    if (customerId) {
      customer = await Customer.findOne({ _id: customerId, businessId }).session(session);
      if (!customer) {
        const err = new Error('Customer not found');
        err.statusCode = 404;
        throw err;
      }
    }

    const populatedItems = [];
    let subtotal = 0;
    let totalQty = 0;
    let totalGst = 0;

    for (const item of items) {
      const { productId, quantity } = item;

      if (!quantity || quantity < 1) {
        const err = new Error(`Invalid quantity for product ${productId}`);
        err.statusCode = 400;
        throw err;
      }

      // Atomic stock deduction — only succeeds if stock >= quantity
      const product = await Product.findOneAndUpdate(
        { _id: productId, businessId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true, session }
      );

      if (!product) {
        const checkProduct = await Product.findOne({ _id: productId, businessId }).session(session);
        if (!checkProduct) {
          const err = new Error(`Product not found: ${productId}`);
          err.statusCode = 404;
          throw err;
        }
        const err = new Error(
          `Insufficient stock for "${checkProduct.name}". Available: ${checkProduct.stock}, Requested: ${quantity}`
        );
        err.statusCode = 400;
        throw err;
      }

      const rate = product.sellingPrice;
      const lineTotal = rate * quantity;
      const lineGst = (lineTotal * product.gstPercentage) / 100;

      subtotal += lineTotal;
      totalQty += quantity;
      totalGst += lineGst;

      populatedItems.push({
        product: product._id,
        productName: product.name,
        quantity,
        rate,
        purchasePrice: product.purchasePrice,
        gstPercentage: product.gstPercentage,
        total: lineTotal,
      });
    }

    // --- Final calculations ---
    const discountAmount = Number(discount) || 0;
    const totalAmount = subtotal - discountAmount + totalGst;
    const receivedAmt = Number(receivedAmount) || 0;
    const balance = totalAmount - receivedAmt;

    // --- Auto-increment bill number (inside transaction) ---
    const billNumber = await Counter.getNextSequence('billNumber', businessId, session);

    // --- Save bill ---
    const [bill] = await Bill.create(
      [
        {
          billNumber,
          customer: customerId,
          businessId,
          items: populatedItems,
          totalQty,
          subtotal,
          discount: discountAmount,
          gst: totalGst,
          totalAmount,
          receivedAmount: receivedAmt,
          balance,
          paymentType,
          date: billData.date || new Date(),
        },
      ],
      { session }
    );

    // --- Auto-create ledger entry for credit bills (only for customers with ID) ---
    if (paymentType === 'credit' && customerId) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await Ledger.create(
        [
          {
            customer: customerId,
            bill: bill._id,
            businessId,
            amount: totalAmount,
            dueDate,
            status: 'pending',
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();

    // Return fully populated bill (only populate customer if customerId exists)
    const billQuery = Bill.findOne({ _id: bill._id, businessId });
    if (customerId) {
      billQuery.populate('customer', 'name phone address');
    }
    return await billQuery.populate('items.product', 'name sellingPrice gstPercentage');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getAllBills = async (businessId) => {
  return await Bill.find({ businessId })
    .sort({ billNumber: -1 })
    .populate({
      path: 'customer',
      select: 'name phone address',
      match: { _id: { $exists: true } }
    })
    .populate('items.product', 'name sellingPrice');
};

const getBillById = async (id, businessId) => {
  const bill = await Bill.findOne({ _id: id, businessId })
    .populate({
      path: 'customer',
      select: 'name phone address',
      match: { _id: { $exists: true } }
    })
    .populate('items.product', 'name sellingPrice gstPercentage');
  if (!bill) {
    const err = new Error('Bill not found');
    err.statusCode = 404;
    throw err;
  }
  return bill;
};

const getBillsByCustomer = async (customerId, businessId) => {
  return await Bill.find({ customer: customerId, businessId })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name sellingPrice');
};

module.exports = { createBill, getAllBills, getBillById, getBillsByCustomer };
