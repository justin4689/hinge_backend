export function computeDistanceScore(distanceMeters, maxDistanceMeters) {
  if (distanceMeters >= maxDistanceMeters) return 0
  return 1 - distanceMeters / maxDistanceMeters
}

export function computeActivityScore(lastSeen) {
  const hoursAgo = (Date.now() - new Date(lastSeen).getTime()) / 3_600_000
  if (hoursAgo < 1) return 1
  if (hoursAgo < 24) return 0.8
  if (hoursAgo < 72) return 0.5
  if (hoursAgo < 168) return 0.3
  return 0.1
}

export function computePopularityScore(likesReceived = 0) {
  return Math.min(likesReceived / 100, 1)
}
