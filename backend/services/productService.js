const Product = require('../models/Product');

const createProduct = async (data, businessId) => {
  const product = await Product.create({ ...data, businessId });
  return product;
};

const getAllProducts = async (businessId) => {
  return await Product.find({ businessId }).sort({ createdAt: -1 });
};

const getProductById = async (id, businessId) => {
  const product = await Product.findOne({ _id: id, businessId });
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

const updateProduct = async (id, data, businessId) => {
  delete data.stock;
  const product = await Product.findOneAndUpdate({ _id: id, businessId }, data, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

const deleteProduct = async (id, businessId) => {
  const product = await Product.findOneAndDelete({ _id: id, businessId });
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

const addStock = async (id, quantity, businessId) => {
  if (!quantity || quantity <= 0) {
    const err = new Error('Quantity must be a positive number');
    err.statusCode = 400;
    throw err;
  }
  const product = await Product.findOneAndUpdate(
    { _id: id, businessId },
    { $inc: { stock: quantity } },
    { new: true, runValidators: true }
  );
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, addStock };
