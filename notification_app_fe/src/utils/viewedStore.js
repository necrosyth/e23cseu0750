const viewed = new Set()

export function markViewed(id) {
  viewed.add(id)
}

export function isViewed(id) {
  return viewed.has(id)
}
