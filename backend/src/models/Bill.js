const mongoose = require('mongoose');
const { PAYMENT_TYPES, PAYMENT_STATUSES } = require('../constants');

const customerSnapshotSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, trim: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },
    customerEmail: { type: String, trim: true, default: '' },
    customerAddress: { type: String, trim: true, default: '' },
    customerGST: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const businessSnapshotSchema = new mongoose.Schema(
  {
    businessName: { type: String, trim: true, default: '' },
    businessType: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    phone2: { type: String, trim: true, default: '' },
    gstNumber: { type: String, trim: true, default: '' },
    termsAndConditions: { type: String, trim: true, default: '' },
    thankYouMessage: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    invoiceNumber: { type: String, required: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerName: { type: String, trim: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },
    customerEmail: { type: String, trim: true, default: '' },
    customerAddress: { type: String, trim: true, default: '' },
    customerGST: { type: String, trim: true, default: '' },
    customerSnapshot: { type: customerSnapshotSchema, default: () => ({}) },
    businessSnapshot: { type: businessSnapshotSchema, default: () => ({}) },
    subtotal: { type: Number, required: true, min: 0 },
    totalQty: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    gstPercent: { type: Number, default: 0, min: 0, max: 100 },
    gstAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    receivedAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0, min: 0 },
    paymentType: { type: String, enum: PAYMENT_TYPES, default: 'cash', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'paid', index: true },
    dueDate: { type: Date },
    notes: { type: String, trim: true, default: '' },
    billDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

billSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
billSchema.index({ businessId: 1, createdAt: -1 });
billSchema.index({ businessId: 1, paymentType: 1, balanceAmount: 1 });

module.exports = mongoose.model('Bill', billSchema);
