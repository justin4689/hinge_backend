import { Router } from 'express'
import { body } from 'express-validator'
import { validationResult } from 'express-validator'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { getMatches, getMessages, sendMessage, unmatch } from '../controllers/matches.controller.js'

const router = Router()

function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', data: errors.array() })
  }
  next()
}

router.use(authMiddleware)

router.get('/', getMatches)
router.get('/:matchId/messages', getMessages)
router.post(
  '/:matchId/messages',
  [
    body('content').notEmpty().isString(),
    body('type').optional().isIn(['text', 'gif', 'audio']),
    validate,
  ],
  sendMessage
)
router.delete('/:matchId', unmatch)

export default router
