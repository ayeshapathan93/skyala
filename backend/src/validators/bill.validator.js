const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const billItemSchema = Joi.object({
  productId: objectId.required(),
  name: Joi.string().trim().allow(''),
  unit: Joi.string().trim().allow(''),
  quantity: Joi.number().min(0.01).required(),
  rate: Joi.number().min(0),
});

const createBillSchema = Joi.object({
  customerId: objectId.allow(null, ''),
  customerName: Joi.string().trim().min(1).required(),
  customerPhone: Joi.string().trim().allow(''),
  customerEmail: Joi.string().trim().email().allow(''),
  customerAddress: Joi.string().trim().allow(''),
  customerGST: Joi.string().trim().allow(''),
  items: Joi.array().items(billItemSchema).min(1).required(),
  discountPercent: Joi.number().min(0).max(100).default(0),
  gstPercent: Joi.number().min(0).max(100).default(0),
  receivedAmount: Joi.number().min(0).default(0),
  paymentType: Joi.string().valid('cash', 'online', 'credit').default('cash'),
  dueDate: Joi.date().allow(null),
  billDate: Joi.date().default(() => new Date()),
  notes: Joi.string().trim().allow(''),
  saveCustomer: Joi.boolean().default(false),
});

const listBillsSchema = Joi.object({
  q: Joi.string().trim().allow(''),
  paymentType: Joi.string().valid('cash', 'online', 'credit', 'all').default('all'),
  from: Joi.date(),
  to: Joi.date(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const settlementSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
  note: Joi.string().trim().allow(''),
  billId: Joi.string().allow(null, ''),
});

module.exports = { createBillSchema, listBillsSchema, settlementSchema };
