const Product = require('./product.model');
const AppError = require('../../shared/utils/appError');
const stockService = require('../stock/stock.service');

const toApi = (p) => {
  const obj = { ...(p.toObject ? p.toObject() : p) };
  obj.price = obj.sellingPrice;
  obj.gstPercentage = obj.gstRate;
  obj.gstRate = obj.gstRate;
  obj.stockValue = Number((obj.sellingPrice * obj.stock).toFixed(2));
  obj.marginPercent = obj.sellingPrice > 0 ? Number(((obj.sellingPrice - obj.purchasePrice) / obj.sellingPrice * 100).toFixed(2)) : 0;
  obj.lastSoldDate = obj.lastSoldDate ? new Date(obj.lastSoldDate).toISOString().split('T')[0] : null;
  return obj;
};

const getSort = (sortValue = 'createdAt_desc') => {
  switch (sortValue) {
    case 'name_asc':
      return { name: 1 };
    case 'name_desc':
      return { name: -1 };
    case 'stock_asc':
      return { stock: 1 };
    case 'stock_desc':
      return { stock: -1 };
    case 'mrp_asc':
      return { mrp: 1 };
    case 'mrp_desc':
      return { mrp: -1 };
    case 'value_asc':
      return { sellingPrice: 1 };
    case 'value_desc':
      return { sellingPrice: -1 };
    default:
      return { createdAt: -1 };
  }
};

const listProducts = async ({ businessId, search, category, status, page = 1, limit = 20, sort }) => {
  const query = { businessId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  if (category && category !== 'all' && category !== 'All Items') {
    query.category = category;
  }

  if (status === 'low') {
    query.stock = { $gt: 0, $lt: 10 };
  } else if (status === 'out') {
    query.stock = 0;
  }

  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const perPage = Number(limit) > 0 ? Number(limit) : 20;
  const sortOption = getSort(sort);

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortOption)
    .skip((pageNum - 1) * perPage)
    .limit(perPage)
    .lean();

  return {
    data: products.map(toApi),
    total,
    page: pageNum,
    totalPages: Math.max(Math.ceil(total / perPage), 1),
    count: products.length,
  };
};

const getProduct = async (id, businessId) => {
  const product = await Product.findOne({ _id: id, businessId }).lean();
  if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  return toApi(product);
};

const createProduct = async (payload, businessId) => {
  if (!payload?.name) throw new AppError('Product name is required', 400, 'VALIDATION_ERROR');
  const sellingPrice = payload.sellingPrice ?? payload.price;
  if (sellingPrice === undefined) throw new AppError('Product price is required', 400, 'VALIDATION_ERROR');

  const created = await Product.create({
    businessId,
    name: payload.name,
    sku: payload.sku || '',
    category: payload.category || '',
    mrp: Number(payload.mrp ?? sellingPrice),
    sellingPrice: Number(sellingPrice),
    purchasePrice: Number(payload.purchasePrice ?? 0),
    lastPurchasePrice: Number(payload.lastPurchasePrice ?? payload.purchasePrice ?? 0),
    gstRate: Number(payload.gstRate ?? payload.gstPercentage ?? 0),
    hsnCode: payload.hsnCode || '',
    barcode: payload.barcode || '',
    supplier: payload.supplier || '',
    stock: Number(payload.stock ?? 0),
    lowStockThreshold: Number(payload.lowStockThreshold ?? 10),
    lastSoldDate: payload.lastSoldDate ? new Date(payload.lastSoldDate) : undefined,
  });

  return toApi(created);
};

const updateProduct = async (id, payload, businessId) => {
  const update = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.sku !== undefined) update.sku = payload.sku;
  if (payload.category !== undefined) update.category = payload.category;
  if (payload.mrp !== undefined) update.mrp = Number(payload.mrp);
  if (payload.price !== undefined) update.sellingPrice = Number(payload.price);
  if (payload.sellingPrice !== undefined) update.sellingPrice = Number(payload.sellingPrice);
  if (payload.purchasePrice !== undefined) update.purchasePrice = Number(payload.purchasePrice);
  if (payload.lastPurchasePrice !== undefined) update.lastPurchasePrice = Number(payload.lastPurchasePrice);
  if (payload.gstRate !== undefined) update.gstRate = Number(payload.gstRate);
  if (payload.gstPercentage !== undefined) update.gstRate = Number(payload.gstPercentage);
  if (payload.hsnCode !== undefined) update.hsnCode = payload.hsnCode;
  if (payload.barcode !== undefined) update.barcode = payload.barcode;
  if (payload.supplier !== undefined) update.supplier = payload.supplier;
  if (payload.stock !== undefined) update.stock = Number(payload.stock);
  if (payload.lowStockThreshold !== undefined) update.lowStockThreshold = Number(payload.lowStockThreshold);
  if (payload.lastSoldDate !== undefined) update.lastSoldDate = payload.lastSoldDate ? new Date(payload.lastSoldDate) : undefined;

  const product = await Product.findOneAndUpdate({ _id: id, businessId }, update, { new: true, runValidators: true });
  if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  return toApi(product);
};

const deleteProduct = async (id, businessId) => {
  const product = await Product.findOneAndDelete({ _id: id, businessId });
  if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  return toApi(product);
};

const adjustStock = async (productId, change, businessId, options = {}, session) => {
  return await stockService.adjustProductStock(productId, change, businessId, options, session);
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustStock };

