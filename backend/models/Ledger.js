const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: [true, 'Customer is required'],
        },
        bill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bill',
            required: [true, 'Bill is required'],
        },
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business',
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue'],
            default: 'pending',
        },
        paidDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ledger', ledgerSchema);
