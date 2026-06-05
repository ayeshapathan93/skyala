const express = require('express');
const router = express.Router();
const { getLedgerByCustomer, markAsPaid, getOverdue } = require('../controllers/ledgerController');

router.get('/overdue', getOverdue);
router.get('/customer/:customerId', getLedgerByCustomer);
router.patch('/:id/mark-paid', markAsPaid);

module.exports = router;
