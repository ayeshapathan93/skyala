const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    rate: {       // sellingPrice at time of billing
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    purchasePrice: { // snapshot for profit calculation
      type: Number,
      required: true,
      min: [0, 'Purchase price cannot be negative'],
    },
    gstPercentage: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: Number,
      // Uniqueness should be per business, enforced in logic or composite index
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false,
    },
    items: {
      type: [billItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Bill must have at least one item',
      },
    },
    totalQty: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    receivedAmount: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    paymentType: {
      type: String,
      enum: ['cash', 'upi', 'credit'],
      required: [true, 'Payment type is required'],
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
