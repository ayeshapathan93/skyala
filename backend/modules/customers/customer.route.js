const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomer } = require('./customer.controller');
const customerLedgerController = require('./ledger.controller');

router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').get(getCustomer);
router.route('/:id/ledger').get(customerLedgerController.getLedger);

module.exports = router;

