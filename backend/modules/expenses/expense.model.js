const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    vendor: { type: String, trim: true, default: '' },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'bank'], default: 'cash' },
    status: { type: String, enum: ['paid', 'pending'], default: 'paid', index: true },
  },
  { timestamps: true }
);

expenseSchema.index({ businessId: 1, date: -1, _id: -1 });
expenseSchema.index({ businessId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

