const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/v1'

export async function fetchNotifications(page = 1, limit = 20, type = '') {
  let url = `${BASE}/notifications?page=${page}&limit=${limit}`
  if (type && type !== 'All') url += `&type=${type}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`api error: ${res.status}`)
  return res.json()
}
