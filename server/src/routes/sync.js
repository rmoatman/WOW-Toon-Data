import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { syncAll } from '../controllers/syncController.js';

const router = Router();

router.post('/', requireAuth, syncAll);

export default router;
