const express = require('express');
const cors = require('cors');
const routes = require('./routes/notifRoutes');
const config = require('./config');
const { log } = require('./logger');

const app = express();

app.use(cors({ origin: config.allowedOrigin }));
app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => {
    log('backend', 'info', 'route', `${req.method} ${req.path} ${res.statusCode}`);
  });
  next();
});

app.use(routes);

app.use((err, req, res, next) => {
  log('backend', 'error', 'handler', err.message || 'internal server error');
  res.status(err.status || 500).json({ success: false, error: err.message || 'internal server error' });
});

module.exports = app;
