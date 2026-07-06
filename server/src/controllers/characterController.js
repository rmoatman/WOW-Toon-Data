import Character from '../models/Character.js';

// GET /api/characters  (requireAuth) — the logged-in user's roster.
export async function listCharacters(req, res, next) {
  try {
    const characters = await Character.find({ userId: req.user._id }).sort({
      level: -1,
      name: 1,
    });
    res.json({ characters });
  } catch (err) {
    next(err);
  }
}

// GET /api/characters/:id  (requireAuth) — a single character the user owns.
export async function getCharacter(req, res, next) {
  try {
    const character = await Character.findOne({ _id: req.params.id, userId: req.user._id });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    res.json({ character });
  } catch (err) {
    next(err);
  }
}
