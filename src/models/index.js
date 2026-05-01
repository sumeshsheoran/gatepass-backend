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

const runMigrations = async () => {
  // Safe ADD COLUMN — SQLite supports ADD but not DROP,
  // so we catch "duplicate column" errors and continue.
  const addColumn = async (table, column, definition) => {
    try {
      await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
      console.log(`Migration: added ${table}.${column}`);
    } catch {
      // column already exists — ignore
    }
  };
  await addColumn('Visitors', 'visitorCompany', 'VARCHAR(255) DEFAULT NULL');
  await addColumn('Users', 'fcmToken', 'VARCHAR(512) DEFAULT NULL');
  await addColumn('Users', 'photoUrl', 'VARCHAR(512) DEFAULT NULL');
};

const syncDB = async () => {
  // force: false — creates tables if they don't exist, never alters/drops
  // safer for SQLite which has limited ALTER TABLE support
  await sequelize.sync({ force: false });
  await runMigrations();
  console.log('SQLite database synced');
};

module.exports = { sequelize, User, Company, Visitor, UserCompany, syncDB };
