const express = require('express');
const customerController = require('../controllers/customer.controller');
const validate = require('../middlewares/validate.middleware');
const {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
} = require('../validators/customer.validator');
const { settlementSchema } = require('../validators/bill.validator');

const router = express.Router();

router.get('/', validate(listCustomersSchema, 'query'), customerController.list);
router.get('/search', customerController.search);
router.post('/', validate(createCustomerSchema), customerController.create);
router.get('/:id', customerController.getById);
router.put('/:id', validate(updateCustomerSchema), customerController.update);
router.delete('/:id', customerController.remove);
router.get('/:id/history', customerController.history);
router.post('/:id/settle', validate(settlementSchema), customerController.settleCredit);

module.exports = router;
