import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// GET /api/health — liveness + DB status. Used by Render's health check.
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'wow-toon-data-api',
    uptime: Math.round(process.uptime()),
    db: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
  });
});

export default router;
