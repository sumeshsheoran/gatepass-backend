const Visitor = require('../models/Visitor');
const User = require('../models/User');
const { paginate } = require('../utils/helpers');
const notificationService = require('../services/notificationService');
const path = require('path');

const buildPhotoUrl = (filename, folder) => {
  if (!filename) return null;
  return `${process.env.BASE_URL}/uploads/${folder}/${filename}`;
};

// POST /api/visitors  — Guard only
const createVisitor = async (req, res) => {
  const { companyId, hostId, visitorName, visitorPhone, visitorEmail, purpose } = req.body;
  try {
    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(400).json({ success: false, message: 'Invalid host' });
    }

    const visitorPhoto = req.files?.visitorPhoto
      ? buildPhotoUrl(req.files.visitorPhoto[0].filename, 'photos')
      : null;
    const idProofPhoto = req.files?.idProof
      ? buildPhotoUrl(req.files.idProof[0].filename, 'ids')
      : null;

    const visitor = await Visitor.create({
      companyId,
      guardId: req.user._id,
      guardName: req.user.name,
      hostId,
      hostName: host.name,
      hostPhone: host.phone,
      visitorName,
      visitorPhone,
      visitorEmail,
      purpose,
      visitorPhoto,
      idProofPhoto,
    });

    // Push notification to host
    if (host.fcmToken) {
      await notificationService.sendToDevice(host.fcmToken, {
        title: 'Visitor Arrived',
        body: `${visitorName} is here to meet you. Purpose: ${purpose}`,
        data: { visitorId: visitor._id.toString(), type: 'visitor_arrived' },
      });
    }

    res.status(201).json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors
// Guard: own visitors | Host: visitors for them | Admin: company visitors | SuperAdmin: all
const getVisitors = async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { status, companyId, date } = req.query;

  try {
    let query = {};

    if (req.user.role === 'guard') {
      query.guardId = req.user._id;
    } else if (req.user.role === 'host') {
      query.hostId = req.user._id;
    } else if (req.user.role === 'admin') {
      query.companyId = { $in: req.user.companyIds };
      if (companyId && req.user.companyIds.map(String).includes(String(companyId))) {
        query.companyId = companyId;
      }
    } else if (req.user.role === 'superAdmin') {
      if (companyId) query.companyId = companyId;
    }

    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.checkInTime = { $gte: start, $lte: end };
    }

    const [visitors, total] = await Promise.all([
      Visitor.find(query).sort({ checkInTime: -1 }).skip(skip).limit(limit),
      Visitor.countDocuments(query),
    ]);

    res.json({
      success: true,
      visitors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors/:id
const getVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/visitors/:id/approve  — Host only
const approveVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (visitor.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your visitor' });
    }
    if (visitor.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Visitor already processed' });
    }

    visitor.status = 'approved';
    visitor.approvedAt = new Date();
    await visitor.save();

    // Notify guard
    const guard = await User.findById(visitor.guardId);
    if (guard?.fcmToken) {
      await notificationService.sendToDevice(guard.fcmToken, {
        title: 'Visitor Approved',
        body: `${req.user.name} approved ${visitor.visitorName}`,
        data: { visitorId: visitor._id.toString(), type: 'visitor_approved' },
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
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (visitor.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your visitor' });
    }
    if (visitor.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Visitor already processed' });
    }

    visitor.status = 'denied';
    visitor.deniedAt = new Date();
    visitor.denialReason = reason || null;
    await visitor.save();

    // Notify guard
    const guard = await User.findById(visitor.guardId);
    if (guard?.fcmToken) {
      await notificationService.sendToDevice(guard.fcmToken, {
        title: 'Visitor Denied',
        body: `${req.user.name} denied entry for ${visitor.visitorName}${reason ? ': ' + reason : ''}`,
        data: { visitorId: visitor._id.toString(), type: 'visitor_denied' },
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
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (visitor.guardId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your visitor entry' });
    }
    if (visitor.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Visitor must be approved before checkout' });
    }

    visitor.status = 'checkedOut';
    visitor.checkOutTime = new Date();
    await visitor.save();

    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createVisitor, getVisitors, getVisitor, approveVisitor, denyVisitor, checkoutVisitor };
