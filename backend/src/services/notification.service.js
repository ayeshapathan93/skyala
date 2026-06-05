const Notification = require('../models/Notification');
const Product = require('../models/Product');

const checkLowStock = async (product, businessId, session) => {
  if (!product || product.stock > product.minimumStockLevel) return null;

  const query = Notification.findOne({
    businessId,
    productId: product._id,
    type: 'low_stock',
    isRead: false,
  });
  if (session) query.session(session);

  const existing = await query;

  if (existing) return existing;

  const opts = session ? { session } : undefined;
  const [notification] = await Notification.create(
    [
      {
        businessId,
        productId: product._id,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${product.name} is low on stock (${product.stock} ${product.unit || 'pcs'} remaining)`,
        metadata: { currentStock: product.stock, minimumStockLevel: product.minimumStockLevel },
      },
    ],
    opts
  );

  return notification;
};

const listNotifications = async (businessId, { unreadOnly = false, page = 1, limit = 20 } = {}) => {
  const filter = { businessId };
  if (unreadOnly) filter.isRead = false;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) || 1 };
};

const markAsRead = async (id, businessId) => {
  return Notification.findOneAndUpdate({ _id: id, businessId }, { isRead: true }, { new: true });
};

const markAllAsRead = async (businessId) => {
  await Notification.updateMany({ businessId, isRead: false }, { isRead: true });
};

const getLowStockProducts = async (businessId, limit = 10) => {
  return Product.find({
    businessId,
    $expr: { $lte: ['$stock', '$minimumStockLevel'] },
  })
    .sort({ stock: 1 })
    .limit(limit)
    .lean();
};

module.exports = {
  checkLowStock,
  listNotifications,
  markAsRead,
  markAllAsRead,
  getLowStockProducts,
};
