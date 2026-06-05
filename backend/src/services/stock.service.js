const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const AppError = require('../utils/appError');
const notificationService = require('./notification.service');

const adjustStock = async (productId, change, businessId, { type = 'adjustment', note = '', billId = null } = {}, session) => {
  const normalizedChange = Number(change);
  if (!Number.isFinite(normalizedChange) || normalizedChange === 0) {
    throw new AppError('Stock change must be a non-zero number', 400, 'INVALID_STOCK_CHANGE');
  }

  const filter = {
    _id: productId,
    businessId,
    ...(normalizedChange < 0 ? { stock: { $gte: Math.abs(normalizedChange) } } : {}),
  };

  const update = {
    $inc: { stock: normalizedChange },
    ...(normalizedChange < 0 ? { $set: { lastSoldDate: new Date() } } : {}),
  };

  const options = { new: false, runValidators: true };
  if (session) options.session = session;

  const productBefore = await Product.findOneAndUpdate(filter, update, options);

  if (!productBefore) throw new AppError('Product not found or insufficient stock', 400, 'INSUFFICIENT_STOCK');

  const quantityBefore = productBefore.stock;
  const quantityAfter = quantityBefore + normalizedChange;
  const product = {
    ...productBefore.toObject(),
    stock: quantityAfter,
    lastSoldDate: normalizedChange < 0 ? new Date() : productBefore.lastSoldDate,
  };

  await StockMovement.create(
    [
      {
        businessId,
        productId,
        billId,
        change: normalizedChange,
        quantityBefore,
        quantityAfter,
        type,
        note,
      },
    ],
    session ? { session } : undefined
  );

  await notificationService.checkLowStock(product, businessId, session);

  return product;
};

const updateStock = async (payload, businessId) => {
  const { productId, change, type, note } = payload;
  return adjustStock(productId, change, businessId, { type, note });
};

const getProductMovements = async (productId, businessId, limit = 50) => {
  return StockMovement.find({ businessId, productId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('billId', 'invoiceNumber billDate')
    .lean();
};

const getStockActivity = async (businessId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const raw = await StockMovement.aggregate([
    {
      $match: {
        businessId: new mongoose.Types.ObjectId(businessId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalChange: { $sum: '$change' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const results = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    const key = day.toISOString().split('T')[0];
    const row = raw.find((item) => item._id === key);
    results.push({ date: key, change: row?.totalChange ?? 0 });
  }

  return results;
};

module.exports = { adjustStock, updateStock, getProductMovements, getStockActivity };
