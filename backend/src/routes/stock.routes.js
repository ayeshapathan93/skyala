const express = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate.middleware');
const { stockUpdateSchema } = require('../validators/product.validator');

const router = express.Router();

router.post('/update', validate(stockUpdateSchema), productController.updateStock);
router.get('/activity', productController.stockActivity);

module.exports = router;
