const service = require('../services/notifService')
const { log } = require('../logger')

const sid = req => Number(req.header('x-student-id') || req.query.studentId || 1042)
const pageLimit = req => ({ page: Number(req.query.page || 1), limit: Number(req.query.limit || 20) })
const bad = (res, code, msg) => res.status(code).json({ success: false, error: msg })

async function listNotifications(req, res, next) {
  try {
    const studentId = sid(req)
    const { page, limit } = pageLimit(req)
    if (page <= 0 || limit <= 0) return bad(res, 400, 'page and limit must be positive numbers')
    const out = service.listNotifications(studentId, page, limit, req.query.type)
    log('backend', 'info', 'controller', `list notifications student=${studentId} page=${page} limit=${limit}`)
    res.json({ success: true, ...out })
  } catch (err) { next(err) }
}

async function getOne(req, res, next) {
  try {
    const item = service.getNotification(sid(req), req.params.id)
    if (!item) return bad(res, 404, 'notification not found')
    res.json({ success: true, data: item })
  } catch (err) { next(err) }
}

async function markOneRead(req, res, next) {
  try {
    const item = service.markOneRead(sid(req), req.params.id)
    if (!item) return bad(res, 404, 'notification not found')
    res.json({ success: true, data: item })
  } catch (err) { next(err) }
}

async function markAllRead(req, res, next) {
  try { res.json({ success: true, data: { updatedCount: service.markAllRead(sid(req)) } }) } catch (err) { next(err) }
}

async function unreadCount(req, res, next) {
  try { res.json({ success: true, data: { count: service.getUnreadCount(sid(req)) } }) } catch (err) { next(err) }
}

async function createOne(req, res, next) {
  try {
    if (req.header('x-admin') !== 'true') return bad(res, 403, 'admin only')
    const { studentId, type, message } = req.body || {}
    if (!studentId || !type || !message) return bad(res, 400, 'studentId, type, message are required')
    res.status(201).json({ success: true, data: service.createNotification(Number(studentId), type, message) })
  } catch (err) { next(err) }
}

async function stream(req, res, next) {
  try {
    const studentId = sid(req)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    if (res.flushHeaders) res.flushHeaders()
    service.addClient(studentId, res)
    res.write(`event: ready\ndata: ${JSON.stringify({ studentId, connectedAt: new Date().toISOString() })}\n\n`)
    req.on('close', () => service.removeClient(studentId, res))
  } catch (err) { next(err) }
}

async function broadcast(req, res, next) {
  try {
    if (req.header('x-admin') !== 'true') return bad(res, 403, 'admin only')
    const { studentIds, type, message } = req.body || {}
    if (!Array.isArray(studentIds) || !studentIds.length || !type || !message) return bad(res, 400, 'studentIds, type, message are required')
    const job = service.createBroadcastJob(studentIds.map(Number), type, message)
    res.status(202).json({ success: true, data: { jobId: job.id, status: job.status } })
  } catch (err) { next(err) }
}

async function jobStatus(req, res, next) {
  try {
    const job = service.getJob(req.params.id)
    if (!job) return bad(res, 404, 'job not found')
    res.json({ success: true, data: job })
  } catch (err) { next(err) }
}

module.exports = { listNotifications, getOne, markOneRead, markAllRead, unreadCount, createOne, stream, broadcast, jobStatus }
