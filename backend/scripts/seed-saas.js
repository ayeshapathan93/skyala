/* eslint-disable no-console */
require('dotenv').config();

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('../shared/config/db');

const Business = require('../models/Business');
const User = require('../models/User');
const Customer = require('../modules/customers/customer.model');
const Product = require('../modules/inventory/product.model');
const Invoice = require('../modules/invoices/invoice.model');
const Transaction = require('../modules/transactions/transaction.model');
const Expense = require('../modules/expenses/expense.model');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  const conn = await connectDB();
  if (!conn) throw new Error('MongoDB not connected. Set MONGO_URI in backend/.env');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set in backend/.env');

  const wipe = process.argv.includes('--wipe');
  if (wipe) {
    await Promise.all([
      Transaction.deleteMany({}),
      Invoice.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      User.deleteMany({ email: 'admin@skyla.local' }),
      Business.deleteMany({ businessName: 'Skyla Demo Business' }),
    ]);
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

  const products =
    (await Product.find({ businessId: business._id }).limit(1)).length > 0
      ? await Product.find({ businessId: business._id }).limit(5)
      : await Product.insertMany([
          { businessId: business._id, name: 'Parle-G 100g', category: 'Biscuits', purchasePrice: 7, sellingPrice: 10, stock: 200 },
          { businessId: business._id, name: 'Dairy Milk 25g', category: 'Chocolates', purchasePrice: 14, sellingPrice: 20, stock: 150 },
          { businessId: business._id, name: 'Tata Salt 1kg', category: 'Staples', purchasePrice: 20, sellingPrice: 28, stock: 120 },
          { businessId: business._id, name: 'Maggi 70g', category: 'Noodles', purchasePrice: 9, sellingPrice: 14, stock: 180 },
          { businessId: business._id, name: 'Amul Butter 100g', category: 'Dairy', purchasePrice: 42, sellingPrice: 55, stock: 80 },
          { businessId: business._id, name: 'Sugar 1kg', category: 'Staples', purchasePrice: 38, sellingPrice: 48, stock: 90 },
          { businessId: business._id, name: 'Cooking Oil 1L', category: 'Oils', purchasePrice: 110, sellingPrice: 135, stock: 70 },
          { businessId: business._id, name: 'Shampoo 180ml', category: 'Personal Care', purchasePrice: 95, sellingPrice: 120, stock: 60 },
          { businessId: business._id, name: 'Detergent 1kg', category: 'Home Care', purchasePrice: 70, sellingPrice: 90, stock: 100 },
          { businessId: business._id, name: 'Toothpaste 100g', category: 'Personal Care', purchasePrice: 45, sellingPrice: 60, stock: 110 },
        ]);

  const customers =
    (await Customer.find({ businessId: business._id }).limit(1)).length > 0
      ? await Customer.find({ businessId: business._id }).limit(5)
      : await Customer.insertMany([
          { businessId: business._id, name: 'Aarav Traders', phone: '9000000001', email: 'aarav@demo.com', type: 'wholesale', gstNumber: '29AAAAA0000A1Z5' },
          { businessId: business._id, name: 'Meera Retail Mart', phone: '9000000002', email: 'meera@demo.com', type: 'retailer', gstNumber: '29BBBBB0000B1Z5' },
          { businessId: business._id, name: 'Kundan Supplies', phone: '9000000003', email: 'kundan@demo.com', type: 'wholesale', gstNumber: '29CCCCC0000C1Z5' },
          { businessId: business._id, name: 'Isha Superstore', phone: '9000000004', email: 'isha@demo.com', type: 'retailer', gstNumber: '29DDDDD0000D1Z5' },
          { businessId: business._id, name: 'Zenith Wholesale', phone: '9000000005', email: 'zenith@demo.com', type: 'wholesale', gstNumber: '29EEEEE0000E1Z5' },
        ]);

  const existingTxnCount = await Transaction.countDocuments({ businessId: business._id });
  if (existingTxnCount === 0) {
    const seedTxns = [];
    for (const c of customers) {
      seedTxns.push(
        {
          businessId: business._id,
          customerId: c._id,
          date: daysAgo(120),
          type: 'opening',
          reference: 'OPENING',
          description: 'Opening balance',
          debit: 2000,
          credit: 0,
        },
        {
          businessId: business._id,
          customerId: c._id,
          date: daysAgo(20),
          type: 'payment',
          reference: 'PAY-SEED',
          description: 'Manual payment',
          debit: 0,
          credit: 800,
          paymentMethod: 'Cash',
          paymentSource: 'manual',
        }
      );
    }
    while (seedTxns.length < 10) seedTxns.push(seedTxns[0]);
    await Transaction.insertMany(seedTxns.slice(0, 10));
  }

  const existingReturnCount = await Transaction.countDocuments({ businessId: business._id, type: 'return' });
  if (existingReturnCount === 0) {
    await Transaction.insertMany([
      {
        businessId: business._id,
        customerId: customers[0]._id,
        date: daysAgo(25),
        type: 'return',
        reference: 'RET-SEED-1',
        description: 'Seed return',
        debit: 250,
        credit: 0,
      },
      {
        businessId: business._id,
        customerId: customers[1]._id,
        date: daysAgo(40),
        type: 'return',
        reference: 'RET-SEED-2',
        description: 'Seed return',
        debit: 180,
        credit: 0,
      },
    ]);
  }

  const existingInvCount = await Invoice.countDocuments({ businessId: business._id });
  if (existingInvCount === 0) {
    const invs = [];
    for (let i = 0; i < 20; i++) {
      const customer = customers[i % customers.length];
      const itemA = products[(i * 2) % products.length];
      const itemB = products[(i * 2 + 1) % products.length];
      const qtyA = 1 + (i % 4);
      const qtyB = 1 + ((i + 1) % 3);
      const items = [
        {
          productId: itemA._id,
          name: itemA.name,
          category: itemA.category || '',
          quantity: qtyA,
          price: itemA.sellingPrice,
          total: itemA.sellingPrice * qtyA,
        },
        {
          productId: itemB._id,
          name: itemB.name,
          category: itemB.category || '',
          quantity: qtyB,
          price: itemB.sellingPrice,
          total: itemB.sellingPrice * qtyB,
        },
      ];
      const subTotal = items.reduce((s, it) => s + it.total, 0);
      const discount = i % 5 === 0 ? Math.round(subTotal * 0.05) : 0;
      const gstAmount = Math.round((subTotal - discount) * 0.05);
      const totalAmount = Math.max(0, subTotal - discount + gstAmount);
      const createdAt = daysAgo(120 - i * 3);

      invs.push({
        businessId: business._id,
        customerId: customer._id,
        items,
        totalAmount,
        gstAmount,
        discount,
        status: 'unpaid',
        createdAt,
      });

      await Transaction.create({
        businessId: business._id,
        customerId: customer._id,
        date: createdAt,
        type: 'invoice',
        reference: `INV-SEED-${i + 1}`,
        description: 'Seed invoice',
        debit: totalAmount,
        credit: 0,
      });

      for (const it of items) {
        await Product.updateOne({ _id: it.productId, businessId: business._id }, { $inc: { stock: -it.quantity } });
      }
    }
    await Invoice.insertMany(invs);
  }

  const token = generateToken(user._id);
  console.log('Seed complete.');
  console.log(`BusinessId: ${business._id}`);
  console.log(`DEV_BUSINESS_ID=${business._id}`);
  console.log('Demo login: email=admin@skyla.local password=password123');
  console.log(`JWT token (Bearer): ${token}`);

  const existingExpenseCount = await Expense.countDocuments({ businessId: business._id });
  if (existingExpenseCount === 0) {
    const categories = ['Rent', 'Utilities', 'Transport', 'Supplies', 'Marketing', 'Repairs', 'Internet', 'Misc'];
    const vendors = ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E'];
    const methods = ['cash', 'upi', 'bank'];
    const statuses = ['paid', 'pending'];

    const expenses = Array.from({ length: 20 }).map((_, i) => {
      const category = categories[i % categories.length];
      const vendor = vendors[i % vendors.length];
      const paymentMethod = methods[i % methods.length];
      const status = statuses[i % statuses.length];
      const amount = 300 + (i % 7) * 250 + Math.floor(Math.random() * 300);
      return {
        businessId: business._id,
        date: daysAgo(3 * i),
        amount,
        category,
        vendor,
        description: `Seed expense: ${category}`,
        paymentMethod,
        status,
      };
    });

    await Expense.insertMany(expenses);
  }

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
