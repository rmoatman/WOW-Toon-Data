import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { listCharacters, getCharacter } from '../controllers/characterController.js';
import { syncOne } from '../controllers/syncController.js';

const router = Router();

router.get('/', requireAuth, listCharacters);
router.get('/:id', requireAuth, getCharacter);
router.post('/:id/sync', requireAuth, syncOne);

export default router;
