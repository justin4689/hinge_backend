import { verifyAccessToken } from '../utils/jwt.js'

export function initSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('AUTH_REQUIRED'))
      const decoded = verifyAccessToken(token)
      socket.userId = decoded.id
      next()
    } catch {
      next(new Error('AUTH_REQUIRED'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(socket.userId)

    socket.on('join_match', (matchId) => {
      socket.join(`match:${matchId}`)
    })

    socket.on('send_message', async ({ matchId, content, type = 'text' }) => {
      io.to(`match:${matchId}`).emit('new_message', {
        matchId,
        senderId: socket.userId,
        content,
        type,
        createdAt: new Date(),
      })
    })

    socket.on('typing', ({ matchId }) => {
      socket.to(`match:${matchId}`).emit('typing', {
        matchId,
        userId: socket.userId,
      })
    })

    socket.on('mark_read', ({ matchId }) => {
      socket.to(`match:${matchId}`).emit('message_read', {
        matchId,
        userId: socket.userId,
      })
    })
  })
}
