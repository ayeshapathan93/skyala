const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');
const OTP = require('../models/OTP');
const asyncHandler = require('../middleware/asyncHandler');

// Helper to generate token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// Helper for mailing
// Helper for mailing (GMAIL VERSION)
const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
         host: "smtp.gmail.com",
         port: 587,
         secure: false,
       // ✅ direct gmail
        auth: {
            user: process.env.SMTP_EMAIL,      // your gmail
            pass: process.env.SMTP_PASSWORD,   // 16 digit app password
        },
    });

    const message = {
        from: `Skyala <${process.env.SMTP_EMAIL}>`, // ✅ same gmail
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(message);
};

// Helper for SMS sending
const sendSMS = async (phone, message) => {
    const smsProvider = process.env.SMS_PROVIDER || 'console';

    if (smsProvider === 'console') {
        // Development mode - log to console
        console.log(`📱 SMS to ${phone}: ${message}`);
        return true;
    }

    // For production - implement actual SMS service
    // Example with Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
    });
    */

    throw new Error('SMS provider not configured');
};

// @desc    Register Business & User
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res, next) => {
    const {
        businessName, businessType, address, city, state, pincode, gstNumber,
        ownerName, email, phone, password
    } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Save/Update OTP
    await OTP.findOneAndUpdate(
        { email },
        { otp: otpCode, expiresAt },
        { upsert: true, new: true }
    );

    // Send OTP via Email and SMS
    let emailSent = false;
    let smsSent = false;

    try {
        await sendEmail({
            email,
            subject: 'Skyala Registration OTP',
            message: `Your verification code is: ${otpCode}. Valid for 5 minutes.`,
        });
        emailSent = true;
    } catch (err) {
        console.error('Email Error:', err);
    }

    try {
        await sendSMS(phone, `Your Skyala verification code is: ${otpCode}. Valid for 5 minutes.`);
        smsSent = true;
    } catch (err) {
        console.error('SMS Error:', err);
    }

    // Log OTP for development
    console.log(`📧 Email OTP for ${email}: ${otpCode} (Sent: ${emailSent})`);
    console.log(`📱 SMS OTP for ${phone}: ${otpCode} (Sent: ${smsSent})`);

    if (!emailSent && !smsSent) {
        return res.status(500).json({ success: false, message: 'Failed to send OTP via email or SMS' });
    }

    // Create User temporarily (isVerified=false)
    // We'll create the Business document after OTP verification
    user = await User.create({
        name: ownerName,
        email,
        phone,
        password,
        isVerified: false
    });

    // Store business details in session/temp if needed, but for now we'll pass them in registration
    // Actually, better to save everything in User and update after verification
    // Or create a pending Registration document.
    // For simplicity based on user request: "4. Save user temporarily with isVerified=false"
    // But we also need the business details. I'll store business details on the user object for now if they are small, 
    // or just ask for them again / store in a temp field.
    // I'll add a 'pendingBusinessData' virtual/field or just create the business document as 'inactive'.

    // Revised: Create business immediately but inactive? No, user said: "Create Business document ... linking user ... If correct:"
    // I'll store the registration data in the User model temporarily or a separate TempUser model.
    // Let's add a `tempBusinessData` field to User.

    user.tempBusinessData = { businessName, businessType, address, city, state, pincode, gstNumber };
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: 'OTP sent to your email and phone number',
        otpSent: { email: emailSent, sms: smsSent }
    });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // OTP correct: Create Business
    const business = await Business.create(user.tempBusinessData);

    // Link User and verify
    user.businessId = business._id;
    user.isVerified = true;
    user.tempBusinessData = undefined;
    await user.save();

    // Delete OTP
    await OTP.deleteOne({ email });

    res.status(200).json({
        success: true,
        token: generateToken(user._id),
        business,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

// @desc    Login
// @route   POST /api/auth/login
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
        return res.status(401).json({ success: false, message: 'Please verify your email first' });
    }

    res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            businessId: user.businessId
        }
    });
});
