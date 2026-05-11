const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 }

export function getScore(notif) {
  const notifDate = new Date(notif.Timestamp.replace(' ', 'T'))
  const now = new Date()
  const ageInHours = (now - notifDate) / (1000 * 60 * 60)

  const weight = TYPE_WEIGHT[notif.Type] || 1
  const recency = 1 / (1 + ageInHours)
  const score = weight * 0.7 + recency * 0.3

  return parseFloat(score.toFixed(4))
}

export function getTopN(notifs, n, typeFilter) {
  let filtered = notifs
  if (typeFilter && typeFilter !== 'All') {
    filtered = notifs.filter(n => n.Type === typeFilter)
  }

  const scored = filtered.map(notif => ({ ...notif, score: getScore(notif) }))
  const sorted = scored.sort((a, b) => b.score - a.score)
  return sorted.slice(0, n)
}
