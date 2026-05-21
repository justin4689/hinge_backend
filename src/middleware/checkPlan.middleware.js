import Like from '../models/Like.js'

export function checkPlan(requiredPlan) {
  const PLAN_RANK = { free: 0, plus: 1, x: 2 }
  return (req, res, next) => {
    const { subscription } = req.user
    const planOk = PLAN_RANK[subscription.plan] >= PLAN_RANK[requiredPlan]
    const activeOk = subscription.status === 'active'
    const notExpired = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd) > new Date()
      : false
    if (!planOk || !activeOk || !notExpired) {
      return res.status(403).json({ success: false, error: 'PLAN_REQUIRED' })
    }
    next()
  }
}

export async function checkLikeLimit(req, res, next) {
  try {
    const { subscription } = req.user
    if (subscription.plan !== 'free') return next()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const count = await Like.countDocuments({
      fromUserId: req.user._id,
      createdAt: { $gte: since },
    })
    if (count >= 8) {
      return res.status(429).json({ success: false, error: 'DAILY_LIKE_LIMIT' })
    }
    next()
  } catch (err) {
    next(err)
  }
}
