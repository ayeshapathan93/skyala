const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
    {
        businessName: {
            type: String,
            required: [true, 'Business name is required'],
            trim: true,
        },
        businessType: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        pincode: {
            type: String,
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Business', businessSchema);
