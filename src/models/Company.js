const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guardIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    logoUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
