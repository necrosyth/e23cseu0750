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

  if (!res.ok) {
    const data = await res.text()
    throw new Error(`auth failed: ${res.status} ${data}`)
  }

  const data = await res.json()
  token = data.access_token
  expiresAt = data.expires_in
  return token
}

async function getToken() {
  const cached = getCachedToken()
  if (cached) return cached
  return fetchToken()
}

module.exports = { getToken }
