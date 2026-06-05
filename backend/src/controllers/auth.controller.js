const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  res.json({ success: true, data: result });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const business = await authService.getBusinessProfile(req.businessId);
  res.json({ success: true, data: business });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const business = await authService.updateBusinessProfile(req.businessId, req.body);
  res.json({ success: true, data: business });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      businessId: req.businessId,
    },
  });
});
