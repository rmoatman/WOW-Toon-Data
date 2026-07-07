import { Router } from 'express';
import mongoose from 'mongoose';
import env from '../config/env.js';

const router = Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// GET /api/health — liveness + DB status. Used by Render's health check.
// `blizzard` reflects whether the Battle.net credentials are configured (a
// boolean only — no secret values are exposed).
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'wow-toon-data-api',
    uptime: Math.round(process.uptime()),
    db: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
    blizzard: Boolean(
      env.blizzard.clientId && env.blizzard.clientSecret && env.blizzard.redirectUri
    ),
  });
});

export default router;
