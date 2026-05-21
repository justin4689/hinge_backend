import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import connectDB from './config/db.js'
import { initSocket } from './socket/index.js'

const PORT = process.env.PORT ?? 5000

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})

app.set('io', io)
initSocket(io)

await connectDB()

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
