const express = require('express');
const c = require('../controllers/notifController');

const router = express.Router();

router.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

router.get('/api/v1/notifications', c.listNotifications);
router.get('/api/v1/notifications/count', c.unreadCount);
router.get('/api/v1/notifications/stream', c.stream);
router.get('/api/v1/notifications/:id', c.getOne);
router.patch('/api/v1/notifications/:id/read', c.markOneRead);
router.patch('/api/v1/notifications/read-all', c.markAllRead);
router.post('/api/v1/notifications', c.createOne);
router.post('/api/v1/notifications/broadcast', c.broadcast);
router.get('/api/v1/notifications/broadcast/:id', c.jobStatus);

module.exports = router;
