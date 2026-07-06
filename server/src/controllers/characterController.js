import Character from '../models/Character.js';
import CharacterAchievement from '../models/CharacterAchievement.js';
import CharacterQuest from '../models/CharacterQuest.js';
import AchievementMeta from '../models/AchievementMeta.js';
import QuestMeta from '../models/QuestMeta.js';

// Confirm the character exists and belongs to the requesting user.
async function ownedCharacter(req) {
  return Character.findOne({ _id: req.params.id, userId: req.user._id });
}

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
    const character = await ownedCharacter(req);
    if (!character) return res.status(404).json({ error: 'Character not found' });
    res.json({ character });
  } catch (err) {
    next(err);
  }
}

// GET /api/characters/:id/achievements  (requireAuth)
// This character's completed achievements, joined to names via the meta cache.
export async function getCharacterAchievements(req, res, next) {
  try {
    const character = await ownedCharacter(req);
    if (!character) return res.status(404).json({ error: 'Character not found' });

    const achievements = await CharacterAchievement.aggregate([
      { $match: { characterId: character._id } },
      {
        $lookup: {
          from: AchievementMeta.collection.name,
          localField: 'achievementId',
          foreignField: 'achievementId',
          as: 'meta',
        },
      },
      { $unwind: { path: '$meta', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          achievementId: 1,
          completedAt: 1,
          name: { $ifNull: ['$meta.name', ''] },
          points: '$meta.points',
          category: '$meta.category',
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({ achievements });
  } catch (err) {
    next(err);
  }
}

// GET /api/characters/:id/quests  (requireAuth)
export async function getCharacterQuests(req, res, next) {
  try {
    const character = await ownedCharacter(req);
    if (!character) return res.status(404).json({ error: 'Character not found' });

    const quests = await CharacterQuest.aggregate([
      { $match: { characterId: character._id } },
      {
        $lookup: {
          from: QuestMeta.collection.name,
          localField: 'questId',
          foreignField: 'questId',
          as: 'meta',
        },
      },
      { $unwind: { path: '$meta', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          questId: 1,
          name: { $ifNull: ['$meta.name', ''] },
          category: '$meta.category',
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({ quests });
  } catch (err) {
    next(err);
  }
}
