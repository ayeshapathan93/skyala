const mongoose = require('mongoose');
const StockLog = require('./stock.model');
const Product = require('../inventory/product.model');
const AppError = require('../../shared/utils/appError');

const getBusinessIdQuery = (businessId) => {
  if (mongoose.isValidObjectId(businessId)) {
    return mongoose.Types.ObjectId(businessId);
  }
  return businessId;
};

const adjustProductStock = async (productId, change, businessId, options = {}, session) => {
  const opts = { new: true };
  if (session) opts.session = session;

  const product = await Product.findOneAndUpdate(
    { _id: productId, businessId: getBusinessIdQuery(businessId) },
    { $inc: { stock: change } },
    opts
  );

  if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  if (product.stock < 0) throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');

  await StockLog.create({
    businessId: getBusinessIdQuery(businessId),
    productId,
    change,
    type: options.type || (change < 0 ? 'sale' : 'purchase'),
    note: options.note || '',
    source: options.source || '',
  });

  return product;
};

const getStockActivity = async (businessId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const raw = await StockLog.aggregate([
    { $match: { businessId: getBusinessIdQuery(businessId), createdAt: { $gte: startDate } } },
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

module.exports = { adjustProductStock, getStockActivity };
