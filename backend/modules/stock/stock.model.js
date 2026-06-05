const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    change: { type: Number, required: true },
    type: { type: String, enum: ['purchase', 'sale', 'adjustment'], default: 'adjustment' },
    note: { type: String, trim: true, default: '' },
    source: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

stockLogSchema.index({ businessId: 1, productId: 1, createdAt: 1 });

module.exports = mongoose.model('StockLog', stockLogSchema);
