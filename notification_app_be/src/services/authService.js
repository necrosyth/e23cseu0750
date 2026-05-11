const config = require('../config')

let token = null
let expiresAt = 0

function getCachedToken() {
  if (!token) return null
  if (Date.now() / 1000 >= expiresAt - 30) return null
  return token
}

async function fetchToken() {
  const res = await fetch(`${config.baseUrl}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: config.email,
      name: config.name,
      rollNo: config.rollNo,
      accessCode: config.accessCode,
      clientID: config.clientId,
      clientSecret: config.clientSecret
    })
  })

  const raw = await res.text()
  let data = {}
  try { data = JSON.parse(raw) } catch (e) {}

  if (!res.ok) {
    const msg = data.message || raw || 'auth failed'
    throw new Error(`auth failed: ${res.status} ${msg}`)
  }

  token = data.access_token
  const ttl = Number(data.expires_in || 0)
  expiresAt = Math.floor(Date.now() / 1000) + ttl

  if (!token) throw new Error('auth failed: missing access_token')
  return token
}

async function getToken() {
  const cached = getCachedToken()
  if (cached) return cached
  return fetchToken()
}

async function getTokenWithExpiry() {
  const t = await getToken()
  return { token: t, expiresAt }
}

module.exports = { getToken, getTokenWithExpiry }
