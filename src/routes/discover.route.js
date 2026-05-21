import { Router } from 'express'
import { body } from 'express-validator'
import { validationResult } from 'express-validator'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { checkLikeLimit } from '../middleware/checkPlan.middleware.js'
import { getFeed, likeUser } from '../controllers/discover.controller.js'

const router = Router()

function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', data: errors.array() })
  }
  next()
}

router.use(authMiddleware)

router.get('/feed', getFeed)

router.post(
  '/like',
  checkLikeLimit,
  [
    body('toUserId').notEmpty(),
    body('targetType').optional().isIn(['photo', 'prompt', 'general']),
    body('comment').optional().isString().isLength({ max: 150 }),
    validate,
  ],
  likeUser
)

export default router
