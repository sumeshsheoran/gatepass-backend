const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Company = sequelize.define('Company', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, defaultValue: null },
  email: { type: DataTypes.STRING, defaultValue: null },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Company;
