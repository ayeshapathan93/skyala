const express = require('express');
const router = express.Router();
const controller = require('./reports.controller');

router.get('/summary', controller.summary);
router.get('/revenue-chart', controller.revenueChart);
router.get('/top-products', controller.topProducts);
router.get('/category-sales', controller.categorySales);
router.get('/monthly-breakdown', controller.monthlyBreakdown);
router.get('/gst', controller.gst);

module.exports = router;

