const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    type: { type: String, enum: ['opening', 'invoice', 'payment', 'return'], required: true, index: true },
    reference: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    debit: { type: Number, required: true, min: 0, default: 0 },
    credit: { type: Number, required: true, min: 0, default: 0 },
    paymentMethod: { type: String, trim: true, default: '' },
    paymentSource: { type: String, trim: true, default: 'manual' },
  },
  { timestamps: true }
);

transactionSchema.index({ businessId: 1, customerId: 1, date: 1, _id: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

