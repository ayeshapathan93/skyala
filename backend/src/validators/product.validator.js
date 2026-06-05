const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  sku: Joi.string().trim().allow(''),
  category: Joi.string().trim().allow(''),
  purchasePrice: Joi.number().min(0).default(0),
  sellingPrice: Joi.number().min(0).required(),
  mrp: Joi.number().min(0),
  gstRate: Joi.number().min(0).max(100).default(0),
  hsnCode: Joi.string().trim().allow(''),
  unit: Joi.string().trim().default('pcs'),
  stock: Joi.number().min(0).default(0),
  minimumStockLevel: Joi.number().min(0).default(10),
  barcode: Joi.string().trim().allow(''),
  supplier: Joi.string().trim().allow(''),
});

const updateProductSchema = createProductSchema.fork(['name', 'sellingPrice'], (s) => s.optional());

const listProductsSchema = Joi.object({
  search: Joi.string().trim().allow(''),
  category: Joi.string().trim().allow(''),
  status: Joi.string().valid('all', 'low', 'out').default('all'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt_desc'),
});

const stockUpdateSchema = Joi.object({
  productId: Joi.string().required(),
  change: Joi.number().required(),
  type: Joi.string().valid('purchase', 'sale', 'adjustment', 'return').default('adjustment'),
  note: Joi.string().trim().allow(''),
});

module.exports = { createProductSchema, updateProductSchema, listProductsSchema, stockUpdateSchema };
