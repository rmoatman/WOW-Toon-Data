import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getAllAchievements, getAchievementCharacters } from '../controllers/combinedController.js';

const router = Router();

router.get('/', requireAuth, getAllAchievements);
router.get('/:achievementId/characters', requireAuth, getAchievementCharacters);

export default router;
