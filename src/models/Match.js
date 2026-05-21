import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const matchSchema = new Schema(
  {
    users: [{ type: Types.ObjectId, ref: 'User' }],
    firstMessage: String,
    lastMessage: String,
    lastActivity: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

matchSchema.index({ users: 1 })
matchSchema.index({ lastActivity: -1 })

const Match = mongoose.model('Match', matchSchema)

export default Match
