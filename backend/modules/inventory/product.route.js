const express = require('express');
const router = express.Router();
const controller = require('./product.controller');

router.route('/').get(controller.getProducts).post(controller.createProduct);
router.route('/:id').get(controller.getProduct).patch(controller.updateProduct).delete(controller.deleteProduct);

module.exports = router;

