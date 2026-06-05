const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const {
  getCustomerLedger,
  createTransaction,
  recordPayment,
} = require('../controllers/customerLedgerController');

router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id/ledger').get(getCustomerLedger);
router.route('/:id/transactions').post(createTransaction);
router.route('/:id/payments').post(recordPayment);
router.route('/:id').get(getCustomer).put(updateCustomer).delete(deleteCustomer);

module.exports = router;
