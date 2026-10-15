import express from 'express'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()

// 1. Parsers and global middleware — before any route.
// The 100kb default is too small for base64 images.
app.use(express.json({ limit: '20mb' }))

// 2. The API, all under one prefix. Matches the Vite proxy in client/vite.config.ts.
app.use('/api', routes)

// 3. Nothing matched.
app.use(notFoundHandler)

// 4. Error handler — always last, after every route.
app.use(errorHandler)

export default app
