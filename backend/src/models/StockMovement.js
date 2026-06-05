const mongoose = require('mongoose');
const { STOCK_MOVEMENT_TYPES } = require('../constants');

const stockMovementSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
    change: { type: Number, required: true },
    quantityBefore: { type: Number, required: true, min: 0 },
    quantityAfter: { type: Number, required: true, min: 0 },
    type: { type: String, enum: STOCK_MOVEMENT_TYPES, required: true },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

stockMovementSchema.index({ businessId: 1, productId: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
