const { Visitor, User } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const buildPhotoUrl = (req, filename, folder) => {
  if (!filename) return null;
  let base = (process.env.BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    // Behind Hostinger nginx proxy — use forwarded headers for real host/proto
    const proto = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('x-forwarded-host') || req.get('host');
    base = `${proto}://${host}`;
  }
  console.log(`Photo URL base: ${base}`); // temporary — remove after confirming
  return `${base}/uploads/${folder}/${filename}`;
};

// POST /api/visitors  — Guard only
const createVisitor = async (req, res) => {
  const { companyId, hostId, visitorName, visitorPhone, visitorEmail, purpose } = req.body;
  try {
    const host = await User.findByPk(hostId);
    if (!host || host.role !== 'host') {
      return res.status(400).json({ success: false, message: 'Invalid host' });
    }

    const visitorPhoto = req.files?.visitorPhoto
      ? buildPhotoUrl(req, req.files.visitorPhoto[0].filename, 'photos')
      : null;
    const idProofPhoto = req.files?.idProof
      ? buildPhotoUrl(req, req.files.idProof[0].filename, 'ids')
      : null;

    const { visitorCompany } = req.body;

    const visitor = await Visitor.create({
      companyId,
      guardId: req.user.id,
      guardName: req.user.name,
      hostId,
      hostName: host.name,
      hostPhone: host.phone,
      visitorName,
      visitorPhone,
      visitorEmail,
      visitorCompany: visitorCompany || null,
      purpose,
      visitorPhoto,
      idProofPhoto,
    });

    if (host.fcmToken) {
      await notificationService.sendToDevice(host.fcmToken, {
        title: 'Visitor Arrived',
        body: `${visitorName} is here to meet you. Purpose: ${purpose}`,
        data: { visitorId: visitor.id, type: 'visitor_arrived' },
      });
    }

    res.status(201).json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors
const getVisitors = async (req, res) => {
  const { status, companyId, date } = req.query;
  try {
    const where = {};

    if (req.user.role === 'guard') {
      where.guardId = req.user.id;
    } else if (req.user.role === 'host') {
      where.hostId = req.user.id;
    } else if (req.user.role === 'admin') {
      where.companyId = { [Op.in]: req.user.companyIds.length ? req.user.companyIds : ['__none__'] };
      if (companyId && req.user.companyIds.includes(companyId)) where.companyId = companyId;
    } else if (req.user.role === 'superAdmin' && companyId) {
      where.companyId = companyId;
    }

    if (status) where.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.checkInTime = { [Op.between]: [start, end] };
    }

    const visitors = await Visitor.findAll({
      where,
      order: [['checkInTime', 'DESC']],
      limit: 100,
    });

    res.json({ success: true, visitors, pagination: { total: visitors.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors/:id
const getVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByPk(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/visitors/:id/approve  — Host only
const approveVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByPk(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    if (visitor.hostId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your visitor' });
    }
    if (visitor.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Visitor already processed' });
    }

    await visitor.update({ status: 'approved', approvedAt: new Date() });

    const guard = await User.findByPk(visitor.guardId);
    if (guard?.fcmToken) {
      await notificationService.sendToDevice(guard.fcmToken, {
        title: 'Visitor Approved',
        body: `${req.user.name} approved ${visitor.visitorName}`,
        data: { visitorId: visitor.id, type: 'visitor_approved' },
      });
    }

    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/visitors/:id/deny  — Host only
const denyVisitor = async (req, res) => {
  const { reason } = req.body;
  try {
    const visitor = await Visitor.findByPk(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    if (visitor.hostId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your visitor' });
    }
    if (visitor.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Visitor already processed' });
    }

    await visitor.update({ status: 'denied', deniedAt: new Date(), denialReason: reason || null });

    const guard = await User.findByPk(visitor.guardId);
    if (guard?.fcmToken) {
      await notificationService.sendToDevice(guard.fcmToken, {
        title: 'Visitor Denied',
        body: `${req.user.name} denied entry for ${visitor.visitorName}${reason ? ': ' + reason : ''}`,
        data: { visitorId: visitor.id, type: 'visitor_denied' },
      });
    }

    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/visitors/:id/checkout  — Guard only
const checkoutVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByPk(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    if (visitor.guardId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your visitor entry' });
    }
    if (visitor.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Visitor must be approved before checkout' });
    }

    await visitor.update({ status: 'checkedOut', checkOutTime: new Date() });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createVisitor, getVisitors, getVisitor, approveVisitor, denyVisitor, checkoutVisitor };
