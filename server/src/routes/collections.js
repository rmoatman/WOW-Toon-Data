import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getMounts, getPets, getToys, getCollectibleImage } from '../controllers/collectionController.js';

const router = Router();

router.get('/mounts', requireAuth, getMounts);
router.get('/pets', requireAuth, getPets);
router.get('/toys', requireAuth, getToys);
// Public image passthrough (no auth) — see controller for why.
router.get('/media/:type/:refId', getCollectibleImage);

export default router;
