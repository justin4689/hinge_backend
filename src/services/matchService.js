import Like from '../models/Like.js'
import Match from '../models/Match.js'

export async function checkAndCreateMatch(fromUserId, toUserId, comment) {
  const mutualLike = await Like.findOne({ fromUserId: toUserId, toUserId: fromUserId })
  if (!mutualLike) return null
  const match = await Match.create({
    users: [fromUserId, toUserId],
    firstMessage: comment ?? '',
    lastActivity: new Date(),
  })
  return match
}
