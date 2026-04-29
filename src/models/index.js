const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Company = require('./Company');
const Visitor = require('./Visitor');

// Explicit junction table — avoids Sequelize association magic issues
const UserCompany = sequelize.define('UserCompany', {
  userId: { type: DataTypes.UUID, allowNull: false },
  companyId: { type: DataTypes.UUID, allowNull: false },
}, { timestamps: false });

const syncDB = async () => {
  await sequelize.sync({ alter: true });
  console.log('SQLite database synced');
};

module.exports = { sequelize, User, Company, Visitor, UserCompany, syncDB };
