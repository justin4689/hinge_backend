import { Router } from 'express'
import { body } from 'express-validator'
import { validationResult } from 'express-validator'
import { register, login, refresh, logout } from '../controllers/auth.controller.js'
import { authLimiter } from '../middleware/rateLimiter.middleware.js'

const router = Router()

function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', data: errors.array() })
  }
  next()
}

const validateRegister = [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('age').isInt({ min: 18 }),
  validate,
]

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
]

router.post('/register', authLimiter, validateRegister, register)
router.post('/login', authLimiter, validateLogin, login)
router.post('/refresh', refresh)
router.post('/logout', logout)

export default router
