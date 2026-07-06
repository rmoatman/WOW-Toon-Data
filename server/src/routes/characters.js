import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { listCharacters, getCharacter } from '../controllers/characterController.js';

const router = Router();

router.get('/', requireAuth, listCharacters);
router.get('/:id', requireAuth, getCharacter);

export default router;
