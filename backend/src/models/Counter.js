const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    year: { type: Number, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

counterSchema.index({ name: 1, businessId: 1, year: 1 }, { unique: true });

counterSchema.statics.getNextInvoiceNumber = async function getNextInvoiceNumber(businessId, session) {
  const year = new Date().getFullYear();
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  if (session) options.session = session;

  let counter;
  try {
    counter = await this.findOneAndUpdate(
      { name: 'invoice', businessId, year },
      { $inc: { seq: 1 } },
      options
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    counter = await this.findOneAndUpdate(
      { name: 'invoice', businessId, year },
      { $inc: { seq: 1 } },
      { ...options, upsert: false }
    );
  }
  const padded = String(counter.seq).padStart(6, '0');
  return `SKYLA-${year}-${padded}`;
};

module.exports = mongoose.model('Counter', counterSchema);
