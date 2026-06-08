const express = require('express');
const billController = require('../controllers/bill.controller');
const validate = require('../middlewares/validate.middleware');
const { createBillSchema, listBillsSchema } = require('../validators/bill.validator');

const router = express.Router();

router.get('/preview-number', billController.previewNumber);
router.get('/credit/outstanding', billController.creditOutstanding);
router.get('/', validate(listBillsSchema, 'query'), billController.list);
router.post('/', validate(createBillSchema), billController.create);
router.get('/:id/html', billController.getHtml);
router.get('/:id/pdf', billController.downloadPdf);
router.get('/:id', billController.getById);
router.delete('/:id', billController.deleteBill);

module.exports = router;
