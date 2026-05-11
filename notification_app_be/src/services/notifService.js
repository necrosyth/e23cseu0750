const config = require('../config')
const { getToken } = require('./authService')
const { log } = require('../logger')

async function getNotifications(page, limit, type) {
  const token = await getToken()
  const res = await fetch(`${config.baseUrl}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  const raw = await res.text()
  let data = {}
  try { data = JSON.parse(raw) } catch (e) {}

  if (!res.ok) {
    const msg = data.message || raw || `status ${res.status}`
    throw new Error(msg)
  }

  let notifs = data.notifications || data.data || []
  if (type && type !== 'All') notifs = notifs.filter(n => n.Type === type || n.type === type)

  const total = notifs.length
  const start = (Number(page) - 1) * Number(limit)
  const end = start + Number(limit)
  const paged = notifs.slice(start, end)

  await log('backend', 'info', 'service', `notifications fetched count=${paged.length} total=${total}`)
  return { notifs: paged, total, page: Number(page), limit: Number(limit) }
}

module.exports = { getNotifications }
