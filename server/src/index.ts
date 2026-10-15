import app from './app.js'
import { env } from './config/env.js'

// Localhost only: anyone else on the network could otherwise spend the API key
const server = app.listen(env.port, '127.0.0.1', () => {
  console.log(`API listening on http://127.0.0.1:${env.port} [${env.nodeEnv}]`)
})

// Let the platform stop us cleanly: finish in-flight requests, then exit.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`)
    server.close(() => process.exit(0))
  })
}
