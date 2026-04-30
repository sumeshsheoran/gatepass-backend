const { User, Company, UserCompany } = require('../models');
const { Op } = require('sequelize');

const getCompanyIds = async (userId) => {
  const links = await UserCompany.findAll({ where: { userId } });
  return links.map((l) => l.companyId);
};

const fmt = async (user) => {
  const companyIds = await getCompanyIds(user.id);
  return user.toSafeJSON(companyIds);
};

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, companyId } = req.query;
    const where = {};
    if (role) where.role = role;

    let userIds = null;

    if (req.user.role === 'admin' && req.user.companyIds.length) {
      const links = await UserCompany.findAll({
        where: { companyId: { [Op.in]: req.user.companyIds } },
      });
      userIds = links.map((l) => l.userId);
    } else if (companyId) {
      const links = await UserCompany.findAll({ where: { companyId } });
      userIds = links.map((l) => l.userId);
    }

    if (userIds !== null) where.id = { [Op.in]: userIds.length ? userIds : ['__none__'] };

    const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
    const result = await Promise.all(users.map(fmt));
    res.json({ success: true, users: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: await fmt(user) });
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
      await UserCompany.bulkCreate(
        assignedIds.map((cId) => ({ userId: user.id, companyId: cId })),
        { ignoreDuplicates: true }
      );
    }

    res.status(201).json({ success: true, user: await fmt(user) });
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
    res.json({ success: true, user: await fmt(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/hosts/search?companyId=&q=
const searchHosts = async (req, res) => {
  const { companyId, q } = req.query;
  try {
    if (!companyId) return res.status(400).json({ success: false, message: 'companyId required' });

    // Get all host user IDs linked to this company
    const links = await UserCompany.findAll({ where: { companyId } });
    const hostUserIds = links.map((l) => l.userId);

    if (!hostUserIds.length) return res.json({ success: true, hosts: [] });

    const where = {
      id: { [Op.in]: hostUserIds },
      role: 'host',
      isActive: true,
    };
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

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'superAdmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete superAdmin' });
    }
    await UserCompany.destroy({ where: { userId: user.id } });
    await user.destroy();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, searchHosts };
