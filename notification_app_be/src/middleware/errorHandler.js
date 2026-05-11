const { log } = require('../logger')

function errorHandler(err, req, res, next) {
  log('backend', 'error', 'handler', err.message)
  res.status(err.status || 500).json({ success: false, error: err.message })
}

module.exports = errorHandler
