const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
    gstNumber: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    type: { type: String, enum: ['retailer', 'wholesale'], default: 'retailer' },
  },
  { timestamps: true }
);

customerSchema.index({ businessId: 1, name: 1 });
customerSchema.index({ businessId: 1, phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
