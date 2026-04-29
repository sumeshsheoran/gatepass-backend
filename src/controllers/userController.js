const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

// GET /api/users  — Admin: company users | SuperAdmin: all
const getUsers = async (req, res) => {
  try {
    let query = {};
    const { role, companyId } = req.query;

    if (req.user.role === 'admin') {
      // Admin can only see users in their companies
      query.companyIds = { $in: req.user.companyIds };
    } else if (companyId) {
      query.companyIds = companyId;
    }
    if (role) query.role = role;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users  — Admin creates hosts | SuperAdmin creates any
const createUser = async (req, res) => {
  const { name, email, password, phone, role, companyIds } = req.body;
  try {
    // Admin can only create hosts for their own companies
    if (req.user.role === 'admin' && role !== 'host') {
      return res.status(403).json({ success: false, message: 'Admins can only create host accounts' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const assignedCompanies = req.user.role === 'admin' ? req.user.companyIds : (companyIds || []);
    const user = await User.create({ name, email, password, phone, role, companyIds: assignedCompanies });

    if (role === 'guard' && assignedCompanies.length) {
      await Company.updateMany(
        { _id: { $in: assignedCompanies } },
        { $addToSet: { guardIds: user._id } }
      );
    }

    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/:id
const updateUser = async (req, res) => {
  const { name, phone, isActive, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // pre-save hook rehashes

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/hosts/search?companyId=&q=  — Guard uses this to find host
const searchHosts = async (req, res) => {
  const { companyId, q } = req.query;
  try {
    if (!companyId) return res.status(400).json({ success: false, message: 'companyId required' });

    const query = {
      role: 'host',
      companyIds: companyId,
      isActive: true,
    };
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const hosts = await User.find(query).select('name email phone photoUrl').limit(20);
    res.json({ success: true, hosts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, searchHosts };
