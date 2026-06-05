const asyncHandler = require('../middleware/asyncHandler');
const productService = require('../services/productService');

// @desc    Create product
// @route   POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.businessId);
  res.status(201).json({ success: true, data: product });
});

// @desc    Get all products
// @route   GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts(req.businessId);
  res.json({ success: true, count: products.length, data: products });
});

// @desc    Get single product
// @route   GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id, req.businessId);
  res.json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.businessId);
  res.json({ success: true, data: product });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.businessId);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Add stock to product
// @route   PATCH /api/products/:id/add-stock
const addStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const product = await productService.addStock(req.params.id, Number(quantity), req.businessId);
  res.json({ success: true, data: product });
});

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct, addStock };
