import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const { Schema } = mongoose

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    age: { type: Number, required: true, min: 18 },
    gender: { type: String, enum: ['man', 'woman', 'nonbinary'] },
    photos: [{ url: String, publicId: String, order: Number }],
    prompts: [{ question: String, answer: String }],
    bio: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
    },
    job: String,
    education: String,
    height: Number,
    religion: String,
    preferences: {
      genderPreference: [String],
      ageMin: { type: Number, default: 18 },
      ageMax: { type: Number, default: 45 },
      maxDistance: { type: Number, default: 50 },
    },
    subscription: {
      plan: { type: String, enum: ['free', 'plus', 'x'], default: 'free' },
      status: { type: String, default: 'inactive' },
      stripeCustomerId: String,
      stripeSubId: String,
      currentPeriodEnd: Date,
    },
    credits: {
      roses: { type: Number, default: 0 },
      boosts: { type: Number, default: 0 },
    },
    profileCompleteness: { type: Number, default: 0 },
    expoPushToken: String,
    notifPrefs: {
      NEW_LIKE: { type: Boolean, default: true },
      NEW_MATCH: { type: Boolean, default: true },
      NEW_MESSAGE: { type: Boolean, default: true },
      MATCH_EXPIRING: { type: Boolean, default: true },
    },
    isVerified: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

userSchema.index({ location: '2dsphere' })
userSchema.index({ age: 1, gender: 1 })
userSchema.index({ 'subscription.stripeCustomerId': 1 })

userSchema.statics.computeCompleteness = function (user) {
  const fields = [
    user.name,
    user.age,
    user.gender,
    user.bio,
    user.job,
    user.education,
    user.height,
    user.religion,
    user.photos?.length > 0,
    user.prompts?.length >= 3,
    user.location?.coordinates?.length === 2,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100) / 100
}

userSchema.pre('save', function (next) {
  this.profileCompleteness = userSchema.statics.computeCompleteness(this)
  next()
})

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

const User = mongoose.model('User', userSchema)

export default User
