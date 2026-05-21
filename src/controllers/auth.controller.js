import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export async function register(req, res, next) {
  try {
    const { name, email, password, age, gender } = req.body
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ success: false, error: 'EMAIL_TAKEN' })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash, age, gender })
    const accessToken = signAccessToken({ id: user._id.toString() })
    const refreshToken = signRefreshToken({ id: user._id.toString() })
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    res.status(201).json({
      success: true,
      data: { accessToken, user: { id: user._id.toString(), name: user.name, email: user.email } },
    })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS' })
    }
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() })
    const accessToken = signAccessToken({ id: user._id.toString() })
    const refreshToken = signRefreshToken({ id: user._id.toString() })
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    res.json({
      success: true,
      data: { accessToken, user: { id: user._id.toString(), name: user.name, email: user.email } },
    })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ success: false, error: 'AUTH_REQUIRED' })
    const decoded = verifyRefreshToken(token)
    const accessToken = signAccessToken({ id: decoded.id })
    res.json({ success: true, data: { accessToken } })
  } catch {
    res.status(401).json({ success: false, error: 'AUTH_REQUIRED' })
  }
}

export async function logout(req, res) {
  res.clearCookie('refreshToken')
  res.json({ success: true, data: null })
}
