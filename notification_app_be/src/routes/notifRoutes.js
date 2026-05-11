const express = require('express')
const { listNotifications } = require('../controllers/notifController')

const router = express.Router()

router.get('/api/v1/notifications', listNotifications)
router.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() })
})

module.exports = router
