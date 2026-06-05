const Customer = require('../models/Customer');
const transactionService = require('./transactionService');

const createCustomer = async (data, businessId) => {
  return await Customer.create({ ...data, businessId });
};

const getAllCustomers = async (businessId, q = '') => {
  const filter = { businessId };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }

  const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
  const summaries = await transactionService.getCustomerSummaries(
    businessId,
    customers.map((c) => c._id)
  );

  return customers.map((c) => {
    const s = summaries.get(String(c._id)) || {
      totalDebit: 0,
      totalCredit: 0,
      outstanding: 0,
      lastActivity: null,
      totalBills: 0,
    };
    return { ...c, ...s };
  });
};

const getCustomerById = async (id, businessId) => {
  const customer = await Customer.findOne({ _id: id, businessId }).lean();
  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }

  const summaries = await transactionService.getCustomerSummaries(businessId, [customer._id]);
  const s = summaries.get(String(customer._id)) || {
    totalDebit: 0,
    totalCredit: 0,
    outstanding: 0,
    lastActivity: null,
    totalBills: 0,
  };

  return { ...customer, ...s };
};

const updateCustomer = async (id, data, businessId) => {
  const customer = await Customer.findOneAndUpdate({ _id: id, businessId }, data, {
    new: true,
    runValidators: true,
  });
  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }
  return customer;
};

const deleteCustomer = async (id, businessId) => {
  const customer = await Customer.findOneAndDelete({ _id: id, businessId });
  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }
  return customer;
};

module.exports = { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };
