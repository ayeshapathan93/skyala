const Joi = require('joi');

const createCustomerSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  phone: Joi.string().trim().allow(''),
  email: Joi.string().email({ tlds: { allow: false } }).allow(''),
  address: Joi.string().trim().allow(''),
  gstNumber: Joi.string().trim().allow(''),
  notes: Joi.string().trim().allow(''),
  type: Joi.string().valid('retailer', 'wholesale').default('retailer'),
});

const updateCustomerSchema = createCustomerSchema.fork(['name'], (s) => s.optional());

const listCustomersSchema = Joi.object({
  q: Joi.string().trim().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { createCustomerSchema, updateCustomerSchema, listCustomersSchema };
