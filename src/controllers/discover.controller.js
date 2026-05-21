import mongoose from 'mongoose'
import User from '../models/User.js'
import Like from '../models/Like.js'
import { checkAndCreateMatch } from '../services/matchService.js'
import { sendPush } from '../services/notificationService.js'

export async function getFeed(req, res, next) {
  try {
    const user = req.user
    const { preferences, location } = user
    if (!location?.coordinates?.length) {
      return res.status(400).json({ success: false, error: 'LOCATION_REQUIRED' })
    }

    const maxDistanceMeters = (preferences?.maxDistance ?? 50) * 1000
    const ageMin = preferences?.ageMin ?? 18
    const ageMax = preferences?.ageMax ?? 45
    const genderPref = preferences?.genderPreference?.length
      ? preferences.genderPreference
      : ['man', 'woman', 'nonbinary']

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const seenLikes = await Like.find({
      fromUserId: user._id,
      createdAt: { $gte: thirtyDaysAgo },
    }).distinct('toUserId')

    const excludedIds = [user._id, ...seenLikes]
    const cursor = req.query.cursor
    if (cursor) excludedIds.push(new mongoose.Types.ObjectId(cursor))

    const feed = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: location.coordinates },
          distanceField: 'distance',
          maxDistance: maxDistanceMeters,
          spherical: true,
        },
      },
      {
        $match: {
          _id: { $nin: excludedIds },
          gender: { $in: genderPref },
          age: { $gte: ageMin, $lte: ageMax },
          'photos.0': { $exists: true },
        },
      },
      {
        $addFields: {
          distanceScore: { $subtract: [1, { $divide: ['$distance', maxDistanceMeters] }] },
          completenessScore: '$profileCompleteness',
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$distanceScore', 0.9] },
              { $multiply: ['$completenessScore', 0.6] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 10 },
      { $project: { name: 1, age: 1, photos: 1, prompts: 1, job: 1, education: 1, distance: 1 } },
    ])

    const nextCursor = feed.length === 10 ? feed[feed.length - 1]._id.toString() : null
    res.json({ success: true, data: { feed, nextCursor } })
  } catch (err) {
    next(err)
  }
}

export async function likeUser(req, res, next) {
  try {
    const { toUserId, targetType, targetId, comment } = req.body
    await Like.create({
      fromUserId: req.user._id,
      toUserId,
      targetType: targetType ?? 'general',
      targetId,
      comment,
    })

    const match = await checkAndCreateMatch(req.user._id, toUserId, comment)
    if (match) {
      const io = req.app.get('io')
      io?.to(toUserId).emit('new_match', { matchId: match._id.toString() })
      io?.to(req.user._id.toString()).emit('new_match', { matchId: match._id.toString() })
      await sendPush(toUserId, {
        title: 'New Match!',
        body: `You matched with ${req.user.name}`,
        data: { type: 'NEW_MATCH', matchId: match._id.toString() },
      })
    } else {
      await sendPush(toUserId, {
        title: 'Someone liked you',
        body: `${req.user.name} liked your profile`,
        data: { type: 'NEW_LIKE' },
      })
    }

    res.json({
      success: true,
      data: { isMatch: !!match, matchId: match ? match._id.toString() : null },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'ALREADY_LIKED' })
    }
    next(err)
  }
}
