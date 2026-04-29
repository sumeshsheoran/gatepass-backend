const Visitor = require('../models/Visitor');
const User = require('../models/User');
const Company = require('../models/Company');

// GET /api/dashboard/live  — Admin: own companies | SuperAdmin: all
const getLiveDashboard = async (req, res) => {
  try {
    let companyFilter = {};
    if (req.user.role === 'admin') {
      companyFilter = { companyId: { $in: req.user.companyIds } };
    } else if (req.query.companyId) {
      companyFilter = { companyId: req.query.companyId };
    }

    const [pending, approved, todayTotal] = await Promise.all([
      Visitor.find({ ...companyFilter, status: 'pending' }).sort({ checkInTime: -1 }),
      Visitor.find({ ...companyFilter, status: 'approved' }).sort({ checkInTime: -1 }),
      (async () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return Visitor.countDocuments({ ...companyFilter, checkInTime: { $gte: start } });
      })(),
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

// GET /api/dashboard/stats  — Admin/SuperAdmin
const getStats = async (req, res) => {
  try {
    let companyFilter = {};
    if (req.user.role === 'admin') {
      companyFilter = { companyId: { $in: req.user.companyIds } };
    } else if (req.query.companyId) {
      companyFilter = { companyId: req.query.companyId };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [todayVisitors, weekVisitors, totalVisitors, statusBreakdown] = await Promise.all([
      Visitor.countDocuments({ ...companyFilter, checkInTime: { $gte: today } }),
      Visitor.countDocuments({ ...companyFilter, checkInTime: { $gte: weekAgo } }),
      Visitor.countDocuments(companyFilter),
      Visitor.aggregate([
        { $match: companyFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // SuperAdmin extras
    let companiesCount = null;
    let usersCount = null;
    if (req.user.role === 'superAdmin') {
      [companiesCount, usersCount] = await Promise.all([
        Company.countDocuments(),
        User.countDocuments({ role: { $ne: 'superAdmin' } }),
      ]);
    }

    res.json({
      success: true,
      stats: {
        todayVisitors,
        weekVisitors,
        totalVisitors,
        statusBreakdown: Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count])),
        companiesCount,
        usersCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLiveDashboard, getStats };
