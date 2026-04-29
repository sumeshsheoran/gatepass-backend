const { validationResult } = require('express-validator');
const { User, UserCompany } = require('../models');
const { generateToken } = require('../utils/helpers');

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const links = await UserCompany.findAll({ where: { userId: user.id } });
    const companyIds = links.map((l) => l.companyId);

    const token = generateToken(user.id);
    res.json({ success: true, token, user: user.toSafeJSON(companyIds) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/register  — SuperAdmin only
const register = async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role: role || 'superAdmin' });
    const token = generateToken(user.id);
    res.status(201).json({ success: true, token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/auth/fcm-token
const updateFcmToken = async (req, res) => {
  try {
    await User.update({ fcmToken: req.body.fcmToken }, { where: { id: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON(req.user.companyIds) });
};

module.exports = { login, register, updateFcmToken, getMe };
