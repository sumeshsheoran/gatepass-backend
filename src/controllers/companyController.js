const Company = require('../models/Company');
const User = require('../models/User');

// GET /api/companies  — SuperAdmin: all | Admin: own companies
const getCompanies = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'admin') {
      query = { _id: { $in: req.user.companyIds } };
    }
    const companies = await Company.find(query)
      .populate('adminId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/companies/:id
const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('adminId', 'name email phone')
      .populate('guardIds', 'name email phone');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/companies  — SuperAdmin only
const createCompany = async (req, res) => {
  const { name, address, phone, email } = req.body;
  try {
    const company = await Company.create({ name, address, phone, email });
    res.status(201).json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/companies/:id  — SuperAdmin only
const updateCompany = async (req, res) => {
  const { name, address, phone, email, isActive } = req.body;
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { name, address, phone, email, isActive },
      { new: true, runValidators: true }
    );
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/companies/:id/assign-guard  — SuperAdmin only
const assignGuard = async (req, res) => {
  const { guardId } = req.body;
  try {
    const [company, guard] = await Promise.all([
      Company.findById(req.params.id),
      User.findById(guardId),
    ]);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (!guard || guard.role !== 'guard') {
      return res.status(400).json({ success: false, message: 'User is not a guard' });
    }

    await Promise.all([
      Company.findByIdAndUpdate(req.params.id, { $addToSet: { guardIds: guardId } }),
      User.findByIdAndUpdate(guardId, { $addToSet: { companyIds: req.params.id } }),
    ]);

    res.json({ success: true, message: 'Guard assigned to company' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/companies/:id/remove-guard/:guardId  — SuperAdmin only
const removeGuard = async (req, res) => {
  const { guardId } = req.params;
  try {
    await Promise.all([
      Company.findByIdAndUpdate(req.params.id, { $pull: { guardIds: guardId } }),
      User.findByIdAndUpdate(guardId, { $pull: { companyIds: req.params.id } }),
    ]);
    res.json({ success: true, message: 'Guard removed from company' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCompanies, getCompany, createCompany, updateCompany, assignGuard, removeGuard };
