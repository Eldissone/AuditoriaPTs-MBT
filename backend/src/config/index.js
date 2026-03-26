const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  dbUrl: process.env.DATABASE_URL,
  env: process.env.NODE_ENV || 'development',
  uploadPath: path.join(__dirname, '../uploads')
};
