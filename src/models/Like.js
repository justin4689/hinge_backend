import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const likeSchema = new Schema(
  {
    fromUserId: { type: Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['photo', 'prompt', 'general'] },
    targetId: String,
    comment: { type: String, maxlength: 150 },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
)

likeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true })

const Like = mongoose.model('Like', likeSchema)

export default Like
