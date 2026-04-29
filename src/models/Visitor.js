const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Visitor = sequelize.define('Visitor', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  guardId: { type: DataTypes.UUID, allowNull: false },
  guardName: { type: DataTypes.STRING, allowNull: false },
  hostId: { type: DataTypes.UUID, allowNull: false },
  hostName: { type: DataTypes.STRING, allowNull: false },
  hostPhone: { type: DataTypes.STRING, defaultValue: null },
  visitorName: { type: DataTypes.STRING, allowNull: false },
  visitorPhone: { type: DataTypes.STRING, allowNull: false },
  visitorEmail: { type: DataTypes.STRING, defaultValue: null },
  visitorPhoto: { type: DataTypes.STRING, defaultValue: null },
  idProofPhoto: { type: DataTypes.STRING, defaultValue: null },
  purpose: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  checkInTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  checkOutTime: { type: DataTypes.DATE, defaultValue: null },
  approvedAt: { type: DataTypes.DATE, defaultValue: null },
  deniedAt: { type: DataTypes.DATE, defaultValue: null },
  denialReason: { type: DataTypes.STRING, defaultValue: null },
});

module.exports = Visitor;
