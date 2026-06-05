const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    businessType: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    gstNumber: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    phone2: { type: String, trim: true, default: '' },
    termsAndConditions: { type: String, trim: true, default: 'Add Your Terms and Conditions Here' },
    thankYouMessage: { type: String, trim: true, default: 'Thank you for your business!' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Business', businessSchema);
