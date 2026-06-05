const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.query?.token) {
    token = req.query.token;
  }

  if (!token) {
    throw new AppError('Not authorized to access this route', 401, 'UNAUTHORIZED');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('+password');

  if (!user) {
    throw new AppError('User no longer exists', 401, 'UNAUTHORIZED');
  }

  req.user = user;
  req.businessId = user.businessId;
  next();
});

module.exports = { protect };
