require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT || 4000),
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*'
};
