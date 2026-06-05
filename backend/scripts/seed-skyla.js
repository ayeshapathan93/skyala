require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Business = require('../src/models/Business');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');

const seed = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@skyla.local';
  let user = await User.findOne({ email });
  if (!user) {
    console.log('Run the server first to seed admin user from .env');
    process.exit(1);
  }

  const businessId = user.businessId;
  const wipe = process.argv.includes('--wipe');

  if (wipe) {
    await Promise.all([
      Customer.deleteMany({ businessId }),
      Product.deleteMany({ businessId }),
    ]);
    console.log('Wiped customers and products');
  }

  const existingProducts = await Product.countDocuments({ businessId });
  if (existingProducts === 0) {
    await Product.insertMany([
      {
        businessId,
        name: 'Agroshine (250gm)',
        sku: 'AGR-250',
        category: 'Fertilizer',
        purchasePrice: 2800,
        sellingPrice: 3200,
        unit: '250gm',
        stock: 25,
        minimumStockLevel: 5,
        gstRate: 0,
      },
      {
        businessId,
        name: 'Tricho (1 Liter)',
        sku: 'TRI-1L',
        category: 'Bio',
        purchasePrice: 90,
        sellingPrice: 110,
        unit: '1 Liter',
        stock: 40,
        minimumStockLevel: 10,
        gstRate: 0,
      },
      {
        businessId,
        name: 'Dr Viro 360 (1 kg)',
        sku: 'DV360-1K',
        category: 'Pesticide',
        purchasePrice: 450,
        sellingPrice: 520,
        unit: '1 kg',
        stock: 3,
        minimumStockLevel: 5,
        gstRate: 0,
      },
    ]);
    console.log('Seeded sample products');
  }

  const existingCustomers = await Customer.countDocuments({ businessId });
  if (existingCustomers === 0) {
    await Customer.insertMany([
      {
        businessId,
        name: 'Rabbani Ghdusab Masuldar (At Post Nanand)',
        phone: '8432646964',
        address: 'At Post Nanand',
      },
      {
        businessId,
        name: 'Sample Retail Customer',
        phone: '9876543210',
        address: 'Latur',
      },
    ]);
    console.log('Seeded sample customers');
  }

  console.log('Seed complete. Business ID:', businessId);
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
