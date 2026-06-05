const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    items: { type: [invoiceItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid', index: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
