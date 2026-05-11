const service = require('../services/notifService');
const { log } = require('../logger');

function studentIdFromReq(req) {
  return Number(req.header('x-student-id') || req.query.studentId || 1042);
}

function parsePageLimit(req) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  return { page, limit };
}

async function listNotifications(req, res, next) {
  try {
    const studentId = studentIdFromReq(req);
    const { page, limit } = parsePageLimit(req);
    if (page <= 0 || limit <= 0) {
      return res.status(400).json({ success: false, error: 'page and limit must be positive numbers' });
    }
    const type = req.query.type;
    const data = service.listNotifications(studentId, page, limit, type);
    log('backend', 'info', 'controller', `list notifications student=${studentId} page=${page} limit=${limit}`);
    return res.json({ success: true, ...data });
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const studentId = studentIdFromReq(req);
    const item = service.getNotification(studentId, req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'notification not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return next(err);
  }
}

async function markOneRead(req, res, next) {
  try {
    const studentId = studentIdFromReq(req);
    const item = service.markOneRead(studentId, req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'notification not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const studentId = studentIdFromReq(req);
    const updated = service.markAllRead(studentId);
    return res.json({ success: true, data: { updatedCount: updated } });
  } catch (err) {
    return next(err);
  }
}

async function unreadCount(req, res, next) {
  try {
    const studentId = studentIdFromReq(req);
    const count = service.getUnreadCount(studentId);
    return res.json({ success: true, data: { count } });
  } catch (err) {
    return next(err);
  }
}

async function createOne(req, res, next) {
  try {
    if (req.header('x-admin') !== 'true') {
      return res.status(403).json({ success: false, error: 'admin only' });
    }
    const { studentId, type, message } = req.body || {};
    if (!studentId || !type || !message) {
      return res.status(400).json({ success: false, error: 'studentId, type, message are required' });
    }
    const item = service.createNotification(Number(studentId), type, message);
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return next(err);
  }
}

async function stream(req, res, next) {
  try {
    const studentId = studentIdFromReq(req);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();
    service.addClient(studentId, res);
    res.write(`event: ready\ndata: ${JSON.stringify({ studentId, connectedAt: new Date().toISOString() })}\n\n`);
    req.on('close', () => {
      service.removeClient(studentId, res);
    });
  } catch (err) {
    next(err);
  }
}

async function broadcast(req, res, next) {
  try {
    if (req.header('x-admin') !== 'true') {
      return res.status(403).json({ success: false, error: 'admin only' });
    }
    const { studentIds, type, message } = req.body || {};
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !type || !message) {
      return res.status(400).json({ success: false, error: 'studentIds, type, message are required' });
    }
    const job = service.createBroadcastJob(studentIds.map(Number), type, message);
    return res.status(202).json({ success: true, data: { jobId: job.id, status: job.status } });
  } catch (err) {
    return next(err);
  }
}

async function jobStatus(req, res, next) {
  try {
    const job = service.getJob(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'job not found' });
    return res.json({ success: true, data: job });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listNotifications,
  getOne,
  markOneRead,
  markAllRead,
  unreadCount,
  createOne,
  stream,
  broadcast,
  jobStatus
};
