const config = require('../config')
const { getToken } = require('./authService')
const { log } = require('../logger')

async function getNotifications(page, limit, type) {
  const token = await getToken()
  const url = new URL(`${config.baseUrl}/notifications`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  if (type && type !== 'All') url.searchParams.set('notification_type', type)

  await log('backend', 'info', 'service', `fetch notifications page=${page} limit=${limit} type=${type || 'All'}`)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) {
    const data = await res.text()
    await log('backend', 'error', 'service', `notifications api failed ${res.status}`)
    throw new Error(`notifications api failed: ${res.status} ${data}`)
  }

  const data = await res.json()
  const notifs = data.notifications || []
  await log('backend', 'info', 'service', `notifications fetched count=${notifs.length}`)

  return {
    notifs,
    total: data.total,
    page: data.page,
    limit: data.limit
  }
}

module.exports = { getNotifications }
