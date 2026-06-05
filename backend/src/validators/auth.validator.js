const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).required(),
});

const setupSchema = Joi.object({
  businessName: Joi.string().trim().min(2).required(),
  address: Joi.string().trim().allow(''),
  city: Joi.string().trim().allow(''),
  state: Joi.string().trim().allow(''),
  pincode: Joi.string().trim().allow(''),
  gstNumber: Joi.string().trim().allow(''),
  phone: Joi.string().trim().allow(''),
  phone2: Joi.string().trim().allow(''),
  termsAndConditions: Joi.string().trim().allow(''),
  thankYouMessage: Joi.string().trim().allow(''),
});

module.exports = { loginSchema, setupSchema };
