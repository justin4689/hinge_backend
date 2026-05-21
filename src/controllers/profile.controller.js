import User from '../models/User.js'

export async function getProfile(req, res, next) {
  try {
    res.json({ success: true, data: req.user })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const allowedFields = ['name', 'age', 'gender', 'bio', 'job', 'education', 'height', 'religion', 'preferences', 'prompts']
    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash')
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

export async function updateLocation(req, res, next) {
  try {
    const { longitude, latitude } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { location: { type: 'Point', coordinates: [longitude, latitude] } },
      { new: true }
    ).select('-passwordHash')
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
}

export async function updateExpoPushToken(req, res, next) {
  try {
    const { expoPushToken } = req.body
    await User.findByIdAndUpdate(req.user._id, { expoPushToken })
    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
}
