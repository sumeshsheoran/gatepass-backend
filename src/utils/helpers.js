const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const buildFileUrl = (filename, folder = 'photos') => {
  if (!filename) return null;
  return `${process.env.BASE_URL}/uploads/${folder}/${filename}`;
};

const paginate = (query = {}) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(parseInt(query.limit || '20', 10), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = { generateToken, buildFileUrl, paginate };
