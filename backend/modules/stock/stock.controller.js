const asyncHandler = require('../../shared/middlewares/asyncHandler');
const stockService = require('./stock.service');

const updateStock = asyncHandler(async (req, res) => {
  const { productId, change, type, note, source } = req.body;
  const updated = await stockService.adjustProductStock(productId, Number(change), req.businessId, {
    type,
    note,
    source,
  });
  res.json({ success: true, data: updated });
});

const getActivity = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const activity = await stockService.getStockActivity(req.businessId, days);
  res.json({ success: true, data: activity });
});

module.exports = { updateStock, getActivity };
