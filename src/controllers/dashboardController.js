const { Visitor, Company, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/dashboard/live
const getLiveDashboard = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'admin') {
      where.companyId = { [Op.in]: req.user.companyIds.length ? req.user.companyIds : ['__none__'] };
    } else if (req.query.companyId) {
      where.companyId = req.query.companyId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, approved, todayTotal] = await Promise.all([
      Visitor.findAll({ where: { ...where, status: 'pending' }, order: [['checkInTime', 'DESC']] }),
      Visitor.findAll({ where: { ...where, status: 'approved' }, order: [['checkInTime', 'DESC']] }),
      Visitor.count({ where: { ...where, checkInTime: { [Op.gte]: today } } }),
    ]);

    res.json({
      success: true,
      data: {
        currentlyInside: approved.length,
        pendingApproval: pending.length,
        todayTotal,
        pending,
        approved,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'admin') {
      where.companyId = { [Op.in]: req.user.companyIds.length ? req.user.companyIds : ['__none__'] };
    } else if (req.query.companyId) {
      where.companyId = req.query.companyId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [todayVisitors, weekVisitors, totalVisitors, pending, approved, denied, checkedOut] =
      await Promise.all([
        Visitor.count({ where: { ...where, checkInTime: { [Op.gte]: today } } }),
        Visitor.count({ where: { ...where, checkInTime: { [Op.gte]: weekAgo } } }),
        Visitor.count({ where }),
        Visitor.count({ where: { ...where, status: 'pending' } }),
        Visitor.count({ where: { ...where, status: 'approved' } }),
        Visitor.count({ where: { ...where, status: 'denied' } }),
        Visitor.count({ where: { ...where, status: 'checkedOut' } }),
      ]);

    let companiesCount = null;
    let usersCount = null;
    if (req.user.role === 'superAdmin') {
      [companiesCount, usersCount] = await Promise.all([
        Company.count(),
        User.count({ where: { role: { [Op.ne]: 'superAdmin' } } }),
      ]);
    }

    res.json({
      success: true,
      stats: {
        todayVisitors,
        weekVisitors,
        totalVisitors,
        statusBreakdown: { pending, approved, denied, checkedOut },
        companiesCount,
        usersCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLiveDashboard, getStats };
