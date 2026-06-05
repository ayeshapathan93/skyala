const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {

    // ✅ FIX: allow CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    if (process.env.DISABLE_AUTH === 'true') {
        const businessId = process.env.DEV_BUSINESS_ID || req.headers['x-business-id'];
        if (!businessId) {
            return res.status(400).json({
                success: false,
                message: 'Auth disabled but no DEV_BUSINESS_ID (or x-business-id header) provided',
            });
        }
        req.user = null;
        req.businessId = businessId;
        return next();
    }

    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'The user belonging to this token no longer exists',
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email to continue',
            });
        }

        // Grant access and attach businessId
        req.user = user;
        req.businessId = user.businessId;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
});
