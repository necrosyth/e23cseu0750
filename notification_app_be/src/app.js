const express = require('express')
const config = require('./config')
const requestLogger = require('./middleware/requestLogger')
const errorHandler = require('./middleware/errorHandler')
const notifRoutes = require('./routes/notifRoutes')

const app = express()

app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.allowedOrigin)
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

app.use(requestLogger)
app.use(notifRoutes)
app.use(errorHandler)

module.exports = app
