const { randomUUID } = require('crypto');

const notifications = [];
const jobs = new Map();
const clients = new Map();
const countCache = new Map();

function nowIso() {
  return new Date().toISOString();
}

function seed() {
  if (notifications.length > 0) return;
  const base = [
    { studentId: 1042, type: 'Placement', message: 'Placement drive opens tomorrow' },
    { studentId: 1042, type: 'Event', message: 'Hackathon starts at 5 PM' },
    { studentId: 2001, type: 'Result', message: 'Mid sem results are out' }
  ];
  for (const item of base) {
    const t = nowIso();
    notifications.push({ id: randomUUID(), studentId: item.studentId, type: item.type, message: item.message, isRead: false, createdAt: t, updatedAt: t });
  }
}

function getUnreadCount(studentId) {
  const key = String(studentId);
  const hit = countCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = notifications.filter(n => n.studentId === studentId && !n.isRead).length;
  countCache.set(key, { value, expiresAt: Date.now() + 30000 });
  return value;
}

function clearCountCache(studentId) {
  countCache.delete(String(studentId));
}

function writeSse(studentId, payload) {
  const set = clients.get(String(studentId));
  if (!set) return;
  const line = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) res.write(line);
}

function addClient(studentId, res) {
  const key = String(studentId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(res);
}

function removeClient(studentId, res) {
  const key = String(studentId);
  const set = clients.get(key);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(key);
}

function listNotifications(studentId, page, limit, type) {
  const filtered = notifications
    .filter(n => n.studentId === studentId)
    .filter(n => !type || type === 'All' ? true : n.type === type)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return { data, total, page, limit };
}

function getNotification(studentId, id) {
  return notifications.find(n => n.studentId === studentId && n.id === id) || null;
}

function markOneRead(studentId, id) {
  const item = getNotification(studentId, id);
  if (!item) return null;
  item.isRead = true;
  item.updatedAt = nowIso();
  clearCountCache(studentId);
  return item;
}

function markAllRead(studentId) {
  let updated = 0;
  const t = nowIso();
  for (const n of notifications) {
    if (n.studentId === studentId && !n.isRead) {
      n.isRead = true;
      n.updatedAt = t;
      updated += 1;
    }
  }
  clearCountCache(studentId);
  return updated;
}

function createNotification(studentId, type, message) {
  const t = nowIso();
  const item = { id: randomUUID(), studentId, type, message, isRead: false, createdAt: t, updatedAt: t };
  notifications.push(item);
  clearCountCache(studentId);
  writeSse(studentId, item);
  return item;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function processJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = 'processing';
  const batches = chunk(job.studentIds, 500);
  for (const batch of batches) {
    for (const studentId of batch) {
      const item = createNotification(studentId, job.type, job.message);
      job.created += 1;
      if (Math.random() < 0.004) {
        job.failed.push({ notificationId: item.id, studentId, attempt: 1 });
      }
    }
  }
  for (const fail of job.failed) {
    let ok = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      fail.attempt = attempt;
      if (Math.random() > 0.2) {
        ok = true;
        break;
      }
    }
    if (!ok) job.permanentFailed.push(fail);
  }
  job.status = 'done';
  job.finishedAt = nowIso();
}

function createBroadcastJob(studentIds, type, message) {
  const id = randomUUID();
  jobs.set(id, { id, status: 'queued', type, message, studentIds, created: 0, failed: [], permanentFailed: [], createdAt: nowIso(), finishedAt: null });
  setTimeout(() => processJob(id), 0);
  return jobs.get(id);
}

function getJob(id) {
  return jobs.get(id) || null;
}

seed();

module.exports = {
  listNotifications,
  getNotification,
  markOneRead,
  markAllRead,
  getUnreadCount,
  createNotification,
  addClient,
  removeClient,
  createBroadcastJob,
  getJob
};
