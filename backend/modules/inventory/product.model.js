const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    sku: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    mrp: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, required: [true, 'Selling price is required'], min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 },
    lastPurchasePrice: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, default: 0, min: 0, max: 100 },
    hsnCode: { type: String, trim: true, default: '' },
    barcode: { type: String, trim: true, default: '' },
    supplier: { type: String, trim: true, default: '' },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    lastSoldDate: { type: Date },
  },
  { timestamps: true }
);

productSchema.index({ businessId: 1, name: 1 });

module.exports = mongoose.model('Product', productSchema);

