const sequelize = require('../config/db');
const User = require('./User');
const Company = require('./Company');
const Visitor = require('./Visitor');

// Many-to-many: a user can belong to multiple companies
User.belongsToMany(Company, { through: 'UserCompany', foreignKey: 'userId', otherKey: 'companyId' });
Company.belongsToMany(User, { through: 'UserCompany', foreignKey: 'companyId', otherKey: 'userId' });

const syncDB = async () => {
  await sequelize.sync({ alter: true });
  console.log('SQLite database synced');
};

module.exports = { sequelize, User, Company, Visitor, syncDB };
