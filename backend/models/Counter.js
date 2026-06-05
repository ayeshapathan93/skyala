const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

/**
 * Atomically increments the sequence counter.
 * Accepts an optional Mongoose session so the increment can
 * participate in the caller's transaction (preventing skipped
 * bill numbers when a transaction aborts).
 */
counterSchema.statics.getNextSequence = async function (name, businessId, session) {
  const opts = { new: true, upsert: true };
  if (session) opts.session = session;

  const counter = await this.findOneAndUpdate(
    { _id: name, businessId },
    { $inc: { seq: 1 } },
    opts
  );
  return counter.seq;
};

// Add businessId field
counterSchema.add({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  }
});

// Composite index for uniqueness
counterSchema.index({ _id: 1, businessId: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
