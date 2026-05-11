require('dotenv').config()
const { log } = require('../../logging_middleware/src/index')

const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1
}

function getScore(notif) {
  const notifDate = new Date(notif.Timestamp.replace(' ', 'T'))
  const now = new Date()
  const ageInHours = (now - notifDate) / (1000 * 60 * 60)
  const weight = TYPE_WEIGHT[notif.Type] || 1
  const recency = 1 / (1 + ageInHours)
  const score = weight * 0.7 + recency * 0.3
  return parseFloat(score.toFixed(4))
}

async function fetchTokenFromCreds() {
  const res = await fetch(`${process.env.BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.EMAIL,
      name: process.env.NAME,
      rollNo: process.env.ROLL_NO,
      accessCode: process.env.ACCESS_CODE,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    })
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.access_token || null
}

async function fetchNotifications() {
  await log('backend', 'info', 'service', 'fetching notifications from api')

  let token = process.env.AUTH_TOKEN
  if (!token) token = await fetchTokenFromCreds()

  if (!token) {
    await log('backend', 'error', 'service', 'token not available from env or auth api')
    return []
  }

  try {
    const res = await fetch(`${process.env.BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      await log('backend', 'error', 'service', `api returned status ${res.status}`)
      return []
    }

    const data = await res.json()
    const notifs = data.notifications || data.data || []
    await log('backend', 'info', 'service', `got ${notifs.length} notifications from api`)
    return notifs
  } catch (err) {
    await log('backend', 'error', 'service', `fetch failed: ${err.message}`)
    return []
  }
}

function getTopNotifications(notifs, n) {
  log('backend', 'debug', 'service', `scoring ${notifs.length} notifs, picking top ${n}`)
  const scored = notifs.map(notif => ({ ...notif, score: getScore(notif) }))
  const sorted = scored.sort((a, b) => b.score - a.score)
  return sorted.slice(0, n)
}

function addNewNotification(currentTop, newNotif, n) {
  const scored = { ...newNotif, score: getScore(newNotif) }

  if (currentTop.length < n) {
    const updated = [...currentTop, scored]
    return updated.sort((a, b) => b.score - a.score)
  }

  const lowest = currentTop[currentTop.length - 1]
  if (scored.score > lowest.score) {
    const updated = [...currentTop.slice(0, n - 1), scored]
    return updated.sort((a, b) => b.score - a.score)
  }

  return currentTop
}

module.exports = { fetchNotifications, getTopNotifications, addNewNotification, getScore }
