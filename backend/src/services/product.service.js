const Product = require('../models/Product');
const AppError = require('../utils/appError');
const stockService = require('./stock.service');
const notificationService = require('./notification.service');

const toApi = (p) => {
  const obj = p.toObject ? p.toObject() : { ...p };
  return {
    ...obj,
    price: obj.sellingPrice,
    gstPercentage: obj.gstRate,
    lowStockThreshold: obj.minimumStockLevel,
    lastPurchasePrice: obj.purchasePrice,
    marginPercent:
      obj.sellingPrice > 0
        ? Number((((obj.sellingPrice - obj.purchasePrice) / obj.sellingPrice) * 100).toFixed(2))
        : 0,
    stockValue: Number((obj.sellingPrice * obj.stock).toFixed(2)),
  };
};

const listProducts = async ({ search, category, status, page, limit, sort }, businessId) => {
  const query = { businessId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  if (category && category !== 'all') query.category = category;

  if (status === 'low') {
    query.$expr = { $lte: ['$stock', '$minimumStockLevel'] };
    query.stock = { $gt: 0 };
  } else if (status === 'out') {
    query.stock = 0;
  }

  const sortMap = {
    name_asc: { name: 1 },
    name_desc: { name: -1 },
    stock_asc: { stock: 1 },
    stock_desc: { stock: -1 },
    createdAt_desc: { createdAt: -1 },
  };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(query).sort(sortMap[sort] || { createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    data: products.map(toApi),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const getProduct = async (id, businessId) => {
  // Try to find with businessId first, then fallback to finding without it
  let product = await Product.findOne({ _id: id, businessId });
  if (!product) {
    product = await Product.findById(id);
  }
  if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  return toApi(product);
};

const createProduct = async (payload, businessId) => {
  const product = await Product.create({ ...payload, businessId });
  await notificationService.checkLowStock(product, businessId);
  return toApi(product);
};

const updateProduct = async (id, payload, businessId) => {
  const product = await Product.findOneAndUpdate({ _id: id, businessId }, payload, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  await notificationService.checkLowStock(product, businessId);
  return toApi(product);
};

const deleteProduct = async (id, businessId) => {
  const product = await Product.findOneAndDelete({ _id: id, businessId });
  if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  return toApi(product);
};

const searchProducts = async (q, businessId, limit = 20) => {
  if (!q?.trim()) return [];
  return Product.find({
    businessId,
    $or: [
      { name: { $regex: q.trim(), $options: 'i' } },
      { sku: { $regex: q.trim(), $options: 'i' } },
      { barcode: q.trim() },
    ],
  })
    .limit(limit)
    .lean()
    .then((rows) => rows.map(toApi));
};

const getProductHistory = async (productId, businessId) => {
  return stockService.getProductMovements(productId, businessId);
};

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductHistory,
};
