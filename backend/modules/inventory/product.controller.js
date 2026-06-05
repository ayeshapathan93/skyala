const asyncHandler = require('../../shared/middlewares/asyncHandler');
const productService = require('./product.service');

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts({
    businessId: req.businessId,
    search: req.query.search,
    category: req.query.category,
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
  });

  res.json({
    success: true,
    count: result.data.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    data: result.data,
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id, req.businessId);
  res.json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.businessId);
  res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.businessId);
  res.json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.businessId);
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };

