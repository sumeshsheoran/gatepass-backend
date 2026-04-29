const { User, Company } = require('../models');
const { Op } = require('sequelize');

const fmt = (user, companies) => user.toSafeJSON(
  companies ? companies.map((c) => c.id) : []
);

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, companyId } = req.query;
    const where = {};
    if (role) where.role = role;

    // Build company filter
    let companyWhere = null;
    if (req.user.role === 'admin' && req.user.companyIds.length) {
      companyWhere = { id: req.user.companyIds };
    } else if (companyId) {
      companyWhere = { id: companyId };
    }

    const includeCompanies = {
      model: Company,
      attributes: ['id'],
      through: { attributes: [] },
      ...(companyWhere ? { where: companyWhere } : {}),
    };

    const users = await User.findAll({
      where,
      include: [includeCompanies],
      order: [['createdAt', 'DESC']],
    });

    const result = users.map((u) => fmt(u, u.Companies));
    res.json({ success: true, users: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Company, attributes: ['id'], through: { attributes: [] } }],
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: fmt(user, user.Companies) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users
const createUser = async (req, res) => {
  const { name, email, password, phone, role, companyIds } = req.body;
  try {
    if (req.user.role === 'admin' && role !== 'host') {
      return res.status(403).json({ success: false, message: 'Admins can only create host accounts' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role });

    const assignedIds = req.user.role === 'admin' ? req.user.companyIds : (companyIds || []);
    if (assignedIds.length) {
      const companies = await Company.findAll({ where: { id: assignedIds } });
      await user.setCompanies(companies);
    }

    res.status(201).json({ success: true, user: fmt(user, null) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/:id
const updateUser = async (req, res) => {
  const { name, phone, isActive, password } = req.body;
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();
    res.json({ success: true, user: fmt(user, []) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/hosts/search?companyId=&q=
const searchHosts = async (req, res) => {
  const { companyId, q } = req.query;
  try {
    if (!companyId) return res.status(400).json({ success: false, message: 'companyId required' });

    const where = { role: 'host', isActive: true };
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    const hosts = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'phone', 'photoUrl'],
      include: [{
        model: Company,
        where: { id: companyId },
        through: { attributes: [] },
        attributes: [],
      }],
      limit: 20,
    });

    const result = hosts.map((h) => ({
      _id: h.id, name: h.name, email: h.email, phone: h.phone, photoUrl: h.photoUrl,
    }));
    res.json({ success: true, hosts: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, searchHosts };
