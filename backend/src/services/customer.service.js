const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const AppError = require('../utils/appError');

const createCustomer = async (payload, businessId, session) => {
  if (!session) return Customer.create({ ...payload, businessId });
  const [customer] = await Customer.create([{ ...payload, businessId }], { session });
  return customer;
};

const updateCustomer = async (id, payload, businessId) => {
  const customer = await Customer.findOneAndUpdate({ _id: id, businessId }, payload, {
    new: true,
    runValidators: true,
  });
  if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  return customer;
};

const deleteCustomer = async (id, businessId) => {
  const customer = await Customer.findOneAndDelete({ _id: id, businessId });
  if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  return customer;
};

const getCustomerById = async (id, businessId) => {
  const customer = await Customer.findOne({ _id: id, businessId }).lean();
  if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  return customer;
};

const listCustomers = async ({ q, page, limit }, businessId) => {
  const filter = { businessId };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Customer.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) || 1 };
};

const getCustomerHistory = async (customerId, businessId, { page = 1, limit = 20 } = {}) => {
  const customer = await getCustomerById(customerId, businessId);
  const skip = (page - 1) * limit;

  const [bills, total] = await Promise.all([
    Bill.find({ businessId, customerId }).sort({ billDate: -1 }).skip(skip).limit(limit).lean(),
    Bill.countDocuments({ businessId, customerId }),
  ]);

  const outstanding = await Bill.aggregate([
    {
      $match: {
        businessId: new mongoose.Types.ObjectId(businessId),
        customerId: new mongoose.Types.ObjectId(customerId),
        balanceAmount: { $gt: 0 },
      },
    },
    { $group: { _id: null, total: { $sum: '$balanceAmount' } } },
  ]);

  return {
    customer,
    bills,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    outstandingBalance: outstanding[0]?.total || 0,
  };
};

const searchCustomers = async (q, businessId, limit = 10) => {
  if (!q?.trim()) return [];
  return Customer.find({
    businessId,
    $or: [
      { name: { $regex: q.trim(), $options: 'i' } },
      { phone: { $regex: q.trim(), $options: 'i' } },
    ],
  })
    .sort({ name: 1 })
    .limit(limit)
    .lean();
};

module.exports = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  getCustomerHistory,
  searchCustomers,
};
