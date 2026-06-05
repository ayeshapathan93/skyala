const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    purchasePrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, default: 0, min: 0, max: 100 },
    hsnCode: { type: String, trim: true, default: '' },
    unit: { type: String, trim: true, default: 'pcs' },
    stock: { type: Number, default: 0, min: 0 },
    minimumStockLevel: { type: Number, default: 10, min: 0 },
    barcode: { type: String, trim: true, default: '' },
    supplier: { type: String, trim: true, default: '' },
    lastSoldDate: { type: Date },
  },
  { timestamps: true }
);

productSchema.index({ businessId: 1, name: 1 });
productSchema.index({ businessId: 1, sku: 1 });

module.exports = mongoose.model('Product', productSchema);
