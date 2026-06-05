const Customer = require('./customer.model');
const AppError = require('../../shared/utils/appError');
const transactionService = require('../transactions/transaction.service');

const createCustomer = async (payload, businessId) => {
  const customer = await Customer.create({
    name: payload.name,
    phone: payload.phone || '',
    email: payload.email || '',
    gstNumber: payload.gstNumber || '',
    type: payload.type || 'retailer',
    businessId,
  });
  return customer;
};

const listCustomers = async ({ q }, businessId) => {
  const filter = { businessId };
  const search = typeof q === 'string' ? q.trim() : '';
  if (search) {
    filter.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
  }

  const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
  const summaries = await transactionService.getCustomerSummaries(businessId, customers.map((c) => c._id));

  return customers.map((c) => ({ ...c, ...(summaries.get(String(c._id)) || transactionService.emptySummary()) }));
};

const getCustomerById = async (id, businessId) => {
  const customer = await Customer.findOne({ _id: id, businessId }).lean();
  if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');

  const summaries = await transactionService.getCustomerSummaries(businessId, [customer._id]);
  return { ...customer, ...(summaries.get(String(customer._id)) || transactionService.emptySummary()) };
};

module.exports = { createCustomer, listCustomers, getCustomerById };

