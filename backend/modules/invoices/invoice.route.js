const express = require('express');
const router = express.Router();
const controller = require('./invoice.controller');

router.route('/').get(controller.getInvoices).post(controller.createInvoice);
router.route('/:id').get(controller.getInvoice);

module.exports = router;

