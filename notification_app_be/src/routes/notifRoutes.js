const express = require('express')
const { listNotifications, getAuthToken } = require('../controllers/notifController')

const router = express.Router()

router.get('/api/v1/notifications', listNotifications)
router.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() })
})
router.get('/api/v1/auth-token', getAuthToken)

module.exports = router
