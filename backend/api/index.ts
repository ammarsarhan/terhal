import { handle } from 'hono/vercel'
import app from '../src/app.js'

// Vercel's serverless entry point. Every incoming request (after the
// rewrite in vercel.json routes it here) is handled by this function,
// invoked fresh per-request rather than by a long-running server.
export const config = {
  runtime: 'nodejs',
}

export default handle(app)
