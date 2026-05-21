import mongoose from 'mongoose'

const MAX_RETRIES = 5
const RETRY_DELAY = 5000

async function connectDB(retries = MAX_RETRIES) {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
  } catch (err) {
    if (retries > 0) {
      console.log(`MongoDB connection failed, retrying... (${retries} attempts left)`)
      await new Promise(r => setTimeout(r, RETRY_DELAY))
      return connectDB(retries - 1)
    }
    console.error('MongoDB connection failed after all retries:', err.message)
    process.exit(1)
  }
}

export default connectDB
