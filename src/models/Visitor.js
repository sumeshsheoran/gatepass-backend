const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    guardId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    guardName: { type: String, required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hostName: { type: String, required: true },
    hostPhone: { type: String },

    // Visitor details
    visitorName: { type: String, required: true, trim: true },
    visitorPhone: { type: String, required: true, trim: true },
    visitorEmail: { type: String, lowercase: true, trim: true, default: null },
    visitorPhoto: { type: String, default: null },
    idProofPhoto: { type: String, default: null },
    purpose: { type: String, required: true, trim: true },

    // Status flow: pending → approved/denied → checkedOut
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'checkedOut'],
      default: 'pending',
    },

    checkInTime: { type: Date, default: Date.now },
    checkOutTime: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    deniedAt: { type: Date, default: null },
    denialReason: { type: String, default: null },
  },
  { timestamps: true }
);

// Indexes for common queries
visitorSchema.index({ companyId: 1, status: 1 });
visitorSchema.index({ hostId: 1, status: 1 });
visitorSchema.index({ guardId: 1, checkInTime: -1 });
visitorSchema.index({ checkInTime: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);
