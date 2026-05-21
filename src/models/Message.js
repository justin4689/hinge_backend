import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const messageSchema = new Schema(
  {
    matchId: { type: Types.ObjectId, ref: 'Match', required: true },
    senderId: { type: Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'gif', 'audio'], default: 'text' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
)

messageSchema.index({ matchId: 1, createdAt: -1 })

const Message = mongoose.model('Message', messageSchema)

export default Message
