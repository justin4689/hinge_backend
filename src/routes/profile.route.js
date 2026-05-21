import { Router } from 'express'
import { body } from 'express-validator'
import { validationResult } from 'express-validator'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { getProfile, updateProfile, updateLocation, updateExpoPushToken } from '../controllers/profile.controller.js'

const router = Router()

function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', data: errors.array() })
  }
  next()
}

router.use(authMiddleware)

router.get('/', getProfile)

router.put(
  '/',
  [
    body('age').optional().isInt({ min: 18 }),
    body('gender').optional().isIn(['man', 'woman', 'nonbinary']),
    body('bio').optional().isString().trim(),
    validate,
  ],
  updateProfile
)

router.put(
  '/location',
  [
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('latitude').isFloat({ min: -90, max: 90 }),
    validate,
  ],
  updateLocation
)

router.put(
  '/expo-push-token',
  [body('expoPushToken').notEmpty(), validate],
  updateExpoPushToken
)

export default router
