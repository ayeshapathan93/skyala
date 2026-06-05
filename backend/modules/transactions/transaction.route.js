const express = require('express');
const router = express.Router();
const { recordPayment } = require('./transaction.controller');

// Manual payments only (no payment gateway)
router.post('/customers/:id/payments', recordPayment);

module.exports = router;
