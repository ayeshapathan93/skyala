const AppError = require('./appError');

const parseDateRange = (query) => {
  const fromRaw = query?.from;
  const toRaw = query?.to;

  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;

  if (from && Number.isNaN(from.getTime())) throw new AppError('Invalid from date', 400, 'INVALID_DATE');
  if (to && Number.isNaN(to.getTime())) throw new AppError('Invalid to date', 400, 'INVALID_DATE');

  if (from && to && from > to) throw new AppError('from must be <= to', 400, 'INVALID_DATE_RANGE');

  const match = {};
  if (from) match.$gte = from;
  if (to) match.$lte = to;

  return {
    from,
    to,
    match,
  };
};

module.exports = { parseDateRange };

