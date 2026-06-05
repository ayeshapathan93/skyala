const PAYMENT_TYPES = ['cash', 'online', 'credit'];
const PAYMENT_STATUSES = ['paid', 'partial', 'unpaid'];
const STOCK_MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'return'];
const NOTIFICATION_TYPES = ['low_stock', 'credit_due', 'system'];

module.exports = {
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  STOCK_MOVEMENT_TYPES,
  NOTIFICATION_TYPES,
  INVOICE_PREFIX: 'SKYLA',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};
