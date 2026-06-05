const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/product.service');
const stockService = require('../services/stock.service');

exports.create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.businessId);
  res.status(201).json({ success: true, data: product });
});

exports.list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query, req.businessId);
  res.json({ success: true, ...result });
});

exports.search = asyncHandler(async (req, res) => {
  const data = await productService.searchProducts(req.query.q, req.businessId);
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id, req.businessId);
  res.json({ success: true, data: product });
});

exports.update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.businessId);
  res.json({ success: true, data: product });
});

exports.remove = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.businessId);
  res.json({ success: true, message: 'Product deleted' });
});

exports.history = asyncHandler(async (req, res) => {
  const data = await productService.getProductHistory(req.params.id, req.businessId);
  res.json({ success: true, data });
});

exports.updateStock = asyncHandler(async (req, res) => {
  const product = await stockService.updateStock(req.body, req.businessId);
  res.json({ success: true, data: product });
});

exports.stockActivity = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 30);
  const data = await stockService.getStockActivity(req.businessId, days);
  res.json({ success: true, data });
});
