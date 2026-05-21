import { Router } from 'express'
import { body } from 'express-validator'
import { validationResult } from 'express-validator'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createCheckoutSession, handleWebhook } from '../controllers/payment.controller.js'

const router = Router()

function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', data: errors.array() })
  }
  next()
}

// webhook is mounted in app.js with express.raw() BEFORE express.json()
router.post('/webhook', handleWebhook)

router.post(
  '/checkout',
  authMiddleware,
  [body('plan').isIn(['plus', 'x']), validate],
  createCheckoutSession
)

export default router
