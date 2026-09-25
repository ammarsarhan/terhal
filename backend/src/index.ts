import { serve } from '@hono/node-server'
import app from './app.js'

// Local development entry point only. Vercel does NOT run this file — it
// runs api/index.ts instead, which wraps the same `app` from src/app.ts
// without ever calling serve()/binding a port. Vercel has no persistent
// process to bind a port to; every request there is handled per-invocation.
serve({
  fetch: app.fetch,
  port: 8080,
  hostname: '0.0.0.0'
}, async (info) => {
  console.log(`Backend is running on http://localhost:${info.port}`);
});