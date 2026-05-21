import mongoose from 'mongoose'

const { Schema } = mongoose

const promptSchema = new Schema({
  question: { type: String, required: true },
  category: { type: String, enum: ['fun', 'deep', 'lifestyle'] },
  isActive: { type: Boolean, default: true },
})

const Prompt = mongoose.model('Prompt', promptSchema)

export default Prompt
