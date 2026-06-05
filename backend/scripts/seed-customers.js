/* eslint-disable no-console */
require('dotenv').config();

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Business = require('../models/Business');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  const conn = await connectDB();
  if (!conn) {
    throw new Error('MongoDB not connected. Set MONGO_URI in backend/.env');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set in backend/.env');
  }

  const shouldWipe = process.argv.includes('--wipe');

  if (shouldWipe) {
    await Transaction.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({ email: 'admin@skyla.local' });
    await Business.deleteMany({ businessName: 'Skyla Demo Business' });
  }

  const business =
    (await Business.findOne({ businessName: 'Skyla Demo Business' })) ||
    (await Business.create({
      businessName: 'Skyla Demo Business',
      businessType: 'Retail',
      city: 'Bengaluru',
      state: 'KA',
      gstNumber: '29ABCDE1234F1Z5',
    }));

  let user = await User.findOne({ email: 'admin@skyla.local' });
  if (!user) {
    user = await User.create({
      name: 'Skyla Admin',
      email: 'admin@skyla.local',
      phone: '9999999999',
      password: 'password123',
      role: 'admin',
      businessId: business._id,
      isVerified: true,
    });
  } else {
    await User.updateOne({ _id: user._id }, { $set: { businessId: business._id, isVerified: true } });
  }

  const customersSeed = [
    { name: 'Aarav Traders', phone: '9000000001', email: 'aarav@demo.com', type: 'wholesale', gstNumber: '29AAAAA0000A1Z5' },
    { name: 'Meera Retail Mart', phone: '9000000002', email: 'meera@demo.com', type: 'retailer', gstNumber: '29BBBBB0000B1Z5' },
    { name: 'Kundan Supplies', phone: '9000000003', email: 'kundan@demo.com', type: 'wholesale', gstNumber: '29CCCCC0000C1Z5' },
    { name: 'Isha Superstore', phone: '9000000004', email: 'isha@demo.com', type: 'retailer', gstNumber: '29DDDDD0000D1Z5' },
    { name: 'Zenith Wholesale', phone: '9000000005', email: 'zenith@demo.com', type: 'wholesale', gstNumber: '29EEEEE0000E1Z5' },
  ];

  const createdCustomers = [];
  for (const c of customersSeed) {
    const existing = await Customer.findOne({ businessId: business._id, phone: c.phone });
    const customer =
      existing ||
      (await Customer.create({
        businessId: business._id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        gstNumber: c.gstNumber,
        type: c.type,
      }));
    createdCustomers.push(customer);
  }

  for (const customer of createdCustomers) {
    const existingCount = await Transaction.countDocuments({ businessId: business._id, customerId: customer._id });
    if (existingCount > 0) continue;

    const opening = 2000 + Math.floor(Math.random() * 5000);
    const invoice1 = 1200 + Math.floor(Math.random() * 3000);
    const invoice2 = 800 + Math.floor(Math.random() * 2500);
    const payment = 1000 + Math.floor(Math.random() * 3000);

    await Transaction.insertMany([
      {
        businessId: business._id,
        customerId: customer._id,
        date: daysAgo(90),
        type: 'opening',
        reference: 'OPENING',
        description: 'Opening balance',
        debit: opening,
        credit: 0,
      },
      {
        businessId: business._id,
        customerId: customer._id,
        date: daysAgo(30),
        type: 'invoice',
        reference: `INV-${String(customer._id).slice(-4)}-001`,
        description: 'Invoice',
        debit: invoice1,
        credit: 0,
      },
      {
        businessId: business._id,
        customerId: customer._id,
        date: daysAgo(14),
        type: 'invoice',
        reference: `INV-${String(customer._id).slice(-4)}-002`,
        description: 'Invoice',
        debit: invoice2,
        credit: 0,
      },
      {
        businessId: business._id,
        customerId: customer._id,
        date: daysAgo(7),
        type: 'payment',
        reference: `PAY-${String(customer._id).slice(-4)}-001`,
        description: 'Manual payment',
        debit: 0,
        credit: payment,
        paymentMethod: 'UPI',
        paymentSource: 'manual',
      },
    ]);
  }

  const token = generateToken(user._id);

  console.log('Seed complete.');
  console.log(`BusinessId: ${business._id}`);
  console.log(`DEV_BUSINESS_ID=${business._id}`);
  console.log(`Demo login: email=admin@skyla.local password=password123`);
  console.log(`JWT token (Bearer): ${token}`);

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});

