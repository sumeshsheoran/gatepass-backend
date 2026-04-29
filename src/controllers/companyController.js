const { Company, User } = require('../models');

// GET /api/companies
const getCompanies = async (req, res) => {
  try {
    let companies;
    if (req.user.role === 'admin') {
      companies = await Company.findAll({
        where: { id: req.user.companyIds.length ? req.user.companyIds : ['__none__'] },
        order: [['createdAt', 'DESC']],
      });
    } else {
      // guard and superAdmin see all active companies
      companies = await Company.findAll({
        where: { isActive: true },
        order: [['createdAt', 'DESC']],
      });
    }
    res.json({ success: true, companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/companies/:id
const getCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/companies
const createCompany = async (req, res) => {
  const { name, address, phone, email } = req.body;
  try {
    const company = await Company.create({ name, address, phone, email });
    res.status(201).json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/companies/:id
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    await company.update(req.body);
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/companies/:id/assign-guard
const assignGuard = async (req, res) => {
  const { guardId } = req.body;
  try {
    const [company, guard] = await Promise.all([
      Company.findByPk(req.params.id),
      User.findByPk(guardId),
    ]);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (!guard || guard.role !== 'guard') {
      return res.status(400).json({ success: false, message: 'User is not a guard' });
    }
    await company.addUser(guard);
    res.json({ success: true, message: 'Guard assigned to company' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/companies/:id/remove-guard/:guardId
const removeGuard = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    const guard = await User.findByPk(req.params.guardId);
    if (company && guard) await company.removeUser(guard);
    res.json({ success: true, message: 'Guard removed from company' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCompanies, getCompany, createCompany, updateCompany, assignGuard, removeGuard };
