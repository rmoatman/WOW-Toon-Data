import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { authorize, callback, resync, unlink, status } from '../controllers/blizzardController.js';

const router = Router();

// The callback is a top-level browser redirect from Battle.net (no auth cookie
// dependency — the user is identified via the signed state token).
router.get('/callback', callback);

router.get('/status', requireAuth, status);
router.get('/authorize', requireAuth, authorize);
router.post('/resync', requireAuth, resync);
router.post('/unlink', requireAuth, unlink);

export default router;
