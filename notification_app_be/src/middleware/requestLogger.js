const { log } = require('../logger')

function requestLogger(req, res, next) {
  res.on('finish', () => {
    log('backend', 'info', 'middleware', `${req.method} ${req.path} - ${res.statusCode}`)
  })
  next()
}

module.exports = requestLogger
