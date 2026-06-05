const express = require('express');
const router = express.Router();
const { createBill, getBills, getBill, getBillsByCustomer } = require('../controllers/billController');

router.route('/').get(getBills).post(createBill);
router.get('/customer/:customerId', getBillsByCustomer);
router.route('/:id').get(getBill);

module.exports = router;
