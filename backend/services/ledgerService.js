const Ledger = require('../models/Ledger');
const Customer = require('../models/Customer');

const createLedgerEntry = async (data, businessId) => {
    return await Ledger.create({ ...data, businessId });
};

const getLedgerByCustomer = async (customerId, businessId) => {
    return await Ledger.find({ customer: customerId, businessId })
        .sort({ createdAt: -1 })
        .populate('bill', 'billNumber date totalAmount');
};

const markAsPaid = async (id, businessId) => {
    const entry = await Ledger.findOne({ _id: id, businessId });
    if (!entry) {
        const err = new Error('Ledger entry not found');
        err.statusCode = 404;
        throw err;
    }
    if (entry.status === 'paid') {
        const err = new Error('Already marked as paid');
        err.statusCode = 400;
        throw err;
    }

    entry.status = 'paid';
    entry.paidDate = new Date();
    await entry.save();
    return entry;
};

const getOverdueEntries = async (businessId) => {
    return await Ledger.find({
        businessId,
        status: 'pending',
        dueDate: { $lt: new Date() },
    }).populate('customer', 'name phone').populate('bill', 'billNumber');
};

module.exports = { createLedgerEntry, getLedgerByCustomer, markAsPaid, getOverdueEntries };
