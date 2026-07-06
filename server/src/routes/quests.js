import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getAllQuests, getQuestCharacters } from '../controllers/combinedController.js';

const router = Router();

router.get('/', requireAuth, getAllQuests);
router.get('/:questId/characters', requireAuth, getQuestCharacters);

export default router;
