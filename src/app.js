import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth.route.js'
import profileRoutes from './routes/profile.route.js'
import discoverRoutes from './routes/discover.route.js'
import matchesRoutes from './routes/matches.route.js'
import paymentRoutes from './routes/payment.route.js'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { apiLimiter } from './middleware/rateLimiter.middleware.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(morgan('dev'))

// Stripe webhook MUST be declared before express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())
app.use(cookieParser())
app.use(apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/discover', discoverRoutes)
app.use('/api/matches', matchesRoutes)
app.use('/api/payment', paymentRoutes)

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }))

app.use(errorHandler)

export default app
