const { validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken } = require('../utils/helpers');

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyIds: user.companyIds,
        photoUrl: user.photoUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/register  (SuperAdmin only — creates any user)
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, phone, role, companyIds } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role, companyIds: companyIds || [] });

    // If guard, attach to company's guardIds list
    if (role === 'guard' && companyIds?.length) {
      await Company.updateMany(
        { _id: { $in: companyIds } },
        { $addToSet: { guardIds: user._id } }
      );
    }

    // If admin, set as company admin
    if (role === 'admin' && companyIds?.length) {
      await Company.findByIdAndUpdate(companyIds[0], { adminId: user._id });
    }

    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/auth/fcm-token
const updateFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  try {
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { login, register, updateFcmToken, getMe };
