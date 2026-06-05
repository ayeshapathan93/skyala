const express = require('express');
const router = express.Router();
const controller = require('./stock.controller');

router.post('/update', controller.updateStock);
router.get('/activity', controller.getActivity);

module.exports = router;
