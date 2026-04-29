const { Sequelize } = require('sequelize');
const path = require('path');

// DB_PATH env var lets you point to a folder outside the app directory
// so the database survives deployments (e.g. /home/username/data/db.sqlite)
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

module.exports = sequelize;
