import Character from '../models/Character.js';
import { syncCharacters, deepSyncCharacter } from '../services/characterSync.js';

// POST /api/sync  (requireAuth)
// Deep-sync the user's characters (achievements, quests, media). Body { force }
// syncs all; otherwise only characters whose data is stale (>15 min).
export async function syncAll(req, res, next) {
  try {
    const force = Boolean(req.body?.force);
    const summary = await syncCharacters(req.user, { force });
    res.json({ ok: true, ...summary });
  } catch (err) {
    next(err);
  }
}

// POST /api/characters/:id/sync  (requireAuth) — force deep-sync one character.
export async function syncOne(req, res, next) {
  try {
    const character = await Character.findOne({ _id: req.params.id, userId: req.user._id });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    const result = await deepSyncCharacter(character);
    const fresh = await Character.findById(character._id);
    res.json({ ok: true, result, character: fresh });
  } catch (err) {
    next(err);
  }
}
