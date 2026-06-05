const express = require('express');
const router = express.Router();
const controller = require('./expenses.controller');

router.get('/summary', controller.summary);
router.get('/trend', controller.trend);
router.get('/category-breakdown', controller.categoryBreakdown);
router.route('/').get(controller.listExpenses).post(controller.createExpense);

module.exports = router;

