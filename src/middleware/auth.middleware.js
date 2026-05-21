import { verifyAccessToken } from '../utils/jwt.js'
import User from '../models/User.js'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'AUTH_REQUIRED' })
    }
    const token = authHeader.slice(7)
    const decoded = verifyAccessToken(token)
    req.user = await User.findById(decoded.id).select('-passwordHash')
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'AUTH_REQUIRED' })
    }
    next()
  } catch {
    res.status(401).json({ success: false, error: 'AUTH_REQUIRED' })
  }
}
