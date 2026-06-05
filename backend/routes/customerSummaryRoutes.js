const express = require('express');
const router = express.Router();

const { getCustomerSummary } = require('../controllers/customerSummaryController');

// GET /api/customer-summary?customerName=Ravi
router.get('/', getCustomerSummary);

module.exports = router;

