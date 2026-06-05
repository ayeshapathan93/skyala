const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const AppError = require('../utils/appError');
const logger = require('../config/logger');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

const seedAdminUser = async () => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set — admin user will not be auto-seeded');
    return;
  }

  await User.syncIndexes();

  let user = await User.findOne({ email }).select('+password');
  if (user) return;

  const existingUser = await User.findOne().select('email phone');
  if (existingUser) {
    logger.info(
      `Skipping admin seed — account already exists (${existingUser.email || existingUser.phone})`
    );
    return;
  }

  const business = await Business.create({
    businessName: process.env.BUSINESS_NAME || 'Skyla Organic & Herbal',
    address: process.env.BUSINESS_ADDRESS || 'At Bhoisamudraga, Post Harangul Bk',
    city: process.env.BUSINESS_CITY || 'Latur',
    state: process.env.BUSINESS_STATE || 'Maharashtra',
    pincode: process.env.BUSINESS_PINCODE || '413531',
    phone: process.env.BUSINESS_PHONE || '9970603386',
    phone2: process.env.BUSINESS_PHONE2 || '9970338001',
    termsAndConditions: process.env.BUSINESS_TERMS || 'Add Your Terms and Conditions Here',
    thankYouMessage: process.env.BUSINESS_THANK_YOU || 'Thank you for your business!',
  });

  try {
    user = await User.create({
      name: process.env.ADMIN_NAME || 'Shop Owner',
      email,
      password,
      phone: (process.env.BUSINESS_PHONE || '').trim(),
      businessId: business._id,
      role: 'admin',
    });
    logger.info(`Admin user seeded: ${email}`);
  } catch (err) {
    await Business.findByIdAndDelete(business._id);
    if (err.code === 11000) {
      logger.warn(`Admin seed skipped: duplicate key (${err.message})`);
      return;
    }
    throw err;
  }
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const business = await Business.findById(user.businessId).lean();
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    token,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    business,
  };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token required', 401, 'UNAUTHORIZED');

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  if (decoded.type !== 'refresh') throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
  }

  const token = generateToken(user._id);
  return { token };
};

const getBusinessProfile = async (businessId) => {
  const business = await Business.findById(businessId).lean();
  if (!business) throw new AppError('Business not found', 404, 'NOT_FOUND');
  return business;
};

const updateBusinessProfile = async (businessId, payload) => {
  const business = await Business.findByIdAndUpdate(businessId, payload, { new: true, runValidators: true });
  if (!business) throw new AppError('Business not found', 404, 'NOT_FOUND');
  return business;
};

module.exports = {
  seedAdminUser,
  login,
  refreshAccessToken,
  getBusinessProfile,
  updateBusinessProfile,
};
