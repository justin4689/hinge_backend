import Match from '../models/Match.js'
import Message from '../models/Message.js'
import { sendPush } from '../services/notificationService.js'

export async function getMatches(req, res, next) {
  try {
    const matches = await Match.find({ users: req.user._id, isActive: true })
      .populate('users', 'name photos lastSeen')
      .sort({ lastActivity: -1 })
    res.json({ success: true, data: matches })
  } catch (err) {
    next(err)
  }
}

export async function getMessages(req, res, next) {
  try {
    const { matchId } = req.params
    const match = await Match.findOne({ _id: matchId, users: req.user._id })
    if (!match) return res.status(404).json({ success: false, error: 'MATCH_NOT_FOUND' })
    const messages = await Message.find({ matchId }).sort({ createdAt: -1 }).limit(50)
    res.json({ success: true, data: messages })
  } catch (err) {
    next(err)
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { matchId } = req.params
    const { content, type } = req.body
    const match = await Match.findOne({ _id: matchId, users: req.user._id, isActive: true })
    if (!match) return res.status(404).json({ success: false, error: 'MATCH_NOT_FOUND' })
    const message = await Message.create({ matchId, senderId: req.user._id, content, type: type ?? 'text' })
    await Match.findByIdAndUpdate(matchId, { lastMessage: content, lastActivity: new Date() })
    const io = req.app.get('io')
    io?.to(`match:${matchId}`).emit('new_message', {
      matchId,
      senderId: req.user._id.toString(),
      content,
      type: message.type,
      createdAt: message.createdAt,
    })
    const recipientId = match.users.find(id => id.toString() !== req.user._id.toString())
    await sendPush(recipientId, {
      title: req.user.name,
      body: content,
      data: { type: 'NEW_MESSAGE', matchId: matchId.toString() },
    })
    res.status(201).json({ success: true, data: { id: message._id.toString(), content, type: message.type } })
  } catch (err) {
    next(err)
  }
}

export async function unmatch(req, res, next) {
  try {
    const { matchId } = req.params
    const match = await Match.findOneAndUpdate(
      { _id: matchId, users: req.user._id },
      { isActive: false },
      { new: true }
    )
    if (!match) return res.status(404).json({ success: false, error: 'MATCH_NOT_FOUND' })
    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
}
