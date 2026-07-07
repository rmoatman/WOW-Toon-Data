import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  listCharacters,
  getCharacter,
  updateCharacter,
  getCharacterAchievements,
  getCharacterQuests,
} from '../controllers/characterController.js';
import { syncOne } from '../controllers/syncController.js';

const router = Router();

router.get('/', requireAuth, listCharacters);
router.get('/:id', requireAuth, getCharacter);
router.patch('/:id', requireAuth, updateCharacter);
router.get('/:id/achievements', requireAuth, getCharacterAchievements);
router.get('/:id/quests', requireAuth, getCharacterQuests);
router.post('/:id/sync', requireAuth, syncOne);

export default router;
