const express = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middlewares/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} = require('../validators/product.validator');

const router = express.Router();

router.get('/', validate(listProductsSchema, 'query'), productController.list);
router.get('/search', productController.search);
router.post('/', validate(createProductSchema), productController.create);
router.get('/:id/history', productController.history);
router.get('/:id', productController.getById);
router.put('/:id', validate(updateProductSchema), productController.update);
router.delete('/:id', productController.remove);

module.exports = router;
