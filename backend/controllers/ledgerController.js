const asyncHandler = require('../middleware/asyncHandler');
const ledgerService = require('../services/ledgerService');

// @desc    Get ledger entries by customer
// @route   GET /api/ledger/customer/:customerId
const getLedgerByCustomer = asyncHandler(async (req, res) => {
    const entries = await ledgerService.getLedgerByCustomer(req.params.customerId, req.businessId);
    res.json({ success: true, count: entries.length, data: entries });
});

// @desc    Mark ledger entry as paid
// @route   PATCH /api/ledger/:id/mark-paid
const markAsPaid = asyncHandler(async (req, res) => {
    const entry = await ledgerService.markAsPaid(req.params.id, req.businessId);
    res.json({ success: true, data: entry });
});

// @desc    Get all overdue entries
// @route   GET /api/ledger/overdue
const getOverdue = asyncHandler(async (req, res) => {
    const entries = await ledgerService.getOverdueEntries(req.businessId);
    res.json({ success: true, count: entries.length, data: entries });
});

module.exports = { getLedgerByCustomer, markAsPaid, getOverdue };
