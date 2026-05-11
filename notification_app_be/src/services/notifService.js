const { randomUUID } = require('crypto')

const notifications = []
const jobs = new Map()
const clients = new Map()
const countCache = new Map()

const now = () => new Date().toISOString()
const key = v => String(v)

function seed() {
  if (notifications.length) return
  const base = [
    [1042, 'Placement', 'Placement drive opens tomorrow'],
    [1042, 'Event', 'Hackathon starts at 5 PM'],
    [2001, 'Result', 'Mid sem results are out']
  ]
  for (const [studentId, type, message] of base) notifications.push({ id: randomUUID(), studentId, type, message, isRead: false, createdAt: now(), updatedAt: now() })
}

function writeSse(studentId, payload) {
  const set = clients.get(key(studentId))
  if (!set) return
  const line = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`
  for (const res of set) res.write(line)
}

function clearCount(studentId) {
  countCache.delete(key(studentId))
}

function listNotifications(studentId, page, limit, type) {
  const filtered = notifications
    .filter(n => n.studentId === studentId && (!type || type === 'All' || n.type === type))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const total = filtered.length
  const data = filtered.slice((page - 1) * limit, (page - 1) * limit + limit)
  return { data, total, page, limit }
}

function getNotification(studentId, id) {
  return notifications.find(n => n.studentId === studentId && n.id === id) || null
}

function markOneRead(studentId, id) {
  const item = getNotification(studentId, id)
  if (!item) return null
  item.isRead = true
  item.updatedAt = now()
  clearCount(studentId)
  return item
}

function markAllRead(studentId) {
  let updated = 0
  const t = now()
  for (const n of notifications) if (n.studentId === studentId && !n.isRead) { n.isRead = true; n.updatedAt = t; updated++ }
  clearCount(studentId)
  return updated
}

function getUnreadCount(studentId) {
  const k = key(studentId)
  const hit = countCache.get(k)
  if (hit && hit.expiresAt > Date.now()) return hit.value
  const value = notifications.filter(n => n.studentId === studentId && !n.isRead).length
  countCache.set(k, { value, expiresAt: Date.now() + 30000 })
  return value
}

function createNotification(studentId, type, message) {
  const item = { id: randomUUID(), studentId, type, message, isRead: false, createdAt: now(), updatedAt: now() }
  notifications.push(item)
  clearCount(studentId)
  writeSse(studentId, item)
  return item
}

function addClient(studentId, res) {
  const k = key(studentId)
  if (!clients.has(k)) clients.set(k, new Set())
  clients.get(k).add(res)
}

function removeClient(studentId, res) {
  const set = clients.get(key(studentId))
  if (!set) return
  set.delete(res)
  if (!set.size) clients.delete(key(studentId))
}

async function processJob(id) {
  const job = jobs.get(id)
  if (!job) return
  job.status = 'processing'
  for (let i = 0; i < job.studentIds.length; i += 500) {
    const batch = job.studentIds.slice(i, i + 500)
    for (const studentId of batch) {
      const item = createNotification(studentId, job.type, job.message)
      job.created++
      if (Math.random() < 0.004) job.failed.push({ notificationId: item.id, studentId, attempt: 1 })
    }
  }
  for (const f of job.failed) {
    let ok = false
    for (let attempt = 1; attempt <= 3; attempt++) if (Math.random() > 0.2) { f.attempt = attempt; ok = true; break }
    if (!ok) job.permanentFailed.push(f)
  }
  job.status = 'done'
  job.finishedAt = now()
}

function createBroadcastJob(studentIds, type, message) {
  const id = randomUUID()
  jobs.set(id, { id, status: 'queued', type, message, studentIds, created: 0, failed: [], permanentFailed: [], createdAt: now(), finishedAt: null })
  setTimeout(() => processJob(id), 0)
  return jobs.get(id)
}

const getJob = id => jobs.get(id) || null

seed()

module.exports = { listNotifications, getNotification, markOneRead, markAllRead, getUnreadCount, createNotification, addClient, removeClient, createBroadcastJob, getJob }
