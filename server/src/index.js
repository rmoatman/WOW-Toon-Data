import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import env from './config/env.js';

async function start() {
  const app = createApp();

  // Try to connect to Mongo, but don't crash the server if it's not up yet —
  // the /api/health endpoint reports DB status so you can tell either way.
  try {
    await connectDb();
  } catch (err) {
    console.error('[startup] Could not connect to MongoDB:', err.message);
    console.error('[startup] Server will start anyway; fix MONGO_URI and restart.');
  }

  const server = app.listen(env.port, () => {
    console.log(`[startup] API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[shutdown] ${signal} received, closing...`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
