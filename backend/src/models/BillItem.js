const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true, index: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: '' },
    barcode: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    unit: { type: String, trim: true, default: 'pcs' },
    purchasePrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, default: 0, min: 0, max: 100 },
    hsnCode: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 0.01 },
    rate: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

billItemSchema.index({ billId: 1, productId: 1 });

module.exports = mongoose.model('BillItem', billItemSchema);
