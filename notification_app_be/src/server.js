const app = require('./app')
const config = require('./config')
const { log } = require('./logger')

app.listen(config.port, () => {
  log('backend', 'info', 'config', `server running on port ${config.port}`)
})
