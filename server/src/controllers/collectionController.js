import UserCollectible from '../models/UserCollectible.js';
import { resolveMedia } from '../services/collectibleMedia.js';

// GET /api/collections/mounts  (requireAuth) — the user's account-wide mounts.
export async function getMounts(req, res, next) {
  try {
    const rows = await UserCollectible.find({ userId: req.user._id, type: 'mount' })
      .select('collectibleId name isFavorite -_id')
      .sort({ name: 1 })
      .lean();
    const mounts = rows.map((m) => ({
      id: m.collectibleId,
      mountId: m.collectibleId,
      name: m.name,
      isFavorite: m.isFavorite,
    }));
    res.json({ mounts });
  } catch (err) {
    next(err);
  }
}

// GET /api/collections/pets  (requireAuth) — the user's account-wide battle pets.
export async function getPets(req, res, next) {
  try {
    const rows = await UserCollectible.find({ userId: req.user._id, type: 'pet' })
      .select('collectibleId speciesId name nickname level quality isFavorite -_id')
      .sort({ name: 1 })
      .lean();
    const pets = rows.map((p) => ({
      id: p.collectibleId,
      petId: p.collectibleId,
      speciesId: p.speciesId,
      name: p.name,
      nickname: p.nickname,
      level: p.level,
      quality: p.quality,
      isFavorite: p.isFavorite,
    }));
    res.json({ pets });
  } catch (err) {
    next(err);
  }
}

// GET /api/collections/media/:type/:refId  (public)
// Redirect to the collectible's render on Blizzard's CDN. Public because the
// image is a public asset with nothing user-specific, and <img> requests can't
// carry the auth cookie cross-origin in production. Browsers lazy-load these, so
// only rows actually on screen trigger a resolve.
export async function getCollectibleImage(req, res) {
  const { type, refId } = req.params;
  if (type !== 'mount' && type !== 'pet') return res.status(400).end();
  try {
    const url = await resolveMedia(type, refId);
    if (!url) return res.status(404).end();
    // Allow the client (a different origin in prod) to render this response.
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=86400');
    res.redirect(302, url);
  } catch {
    res.status(404).end();
  }
}
