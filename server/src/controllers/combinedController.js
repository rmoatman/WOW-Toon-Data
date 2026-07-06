import Character from '../models/Character.js';
import CharacterAchievement from '../models/CharacterAchievement.js';
import CharacterQuest from '../models/CharacterQuest.js';
import AchievementMeta from '../models/AchievementMeta.js';
import QuestMeta from '../models/QuestMeta.js';

// GET /api/achievements  (requireAuth)
// Every achievement earned by any of the user's characters, with how many of
// them have it. Powers the combined, sortable/searchable achievement list.
export async function getAllAchievements(req, res, next) {
  try {
    const achievements = await CharacterAchievement.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$achievementId', characterCount: { $sum: 1 } } },
      {
        $lookup: {
          from: AchievementMeta.collection.name,
          localField: '_id',
          foreignField: 'achievementId',
          as: 'meta',
        },
      },
      { $unwind: { path: '$meta', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          achievementId: '$_id',
          name: { $ifNull: ['$meta.name', ''] },
          points: '$meta.points',
          characterCount: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);
    res.json({ achievements });
  } catch (err) {
    next(err);
  }
}

// GET /api/achievements/:achievementId/characters  (requireAuth)
// Which of the user's characters have earned a given achievement.
export async function getAchievementCharacters(req, res, next) {
  try {
    const achievementId = Number(req.params.achievementId);
    const meta = await AchievementMeta.findOne({ achievementId }).lean();
    const characters = await CharacterAchievement.aggregate([
      { $match: { userId: req.user._id, achievementId } },
      {
        $lookup: {
          from: Character.collection.name,
          localField: 'characterId',
          foreignField: '_id',
          as: 'char',
        },
      },
      { $unwind: '$char' },
      {
        $project: {
          _id: 0,
          id: '$char._id',
          completedAt: 1,
          name: '$char.name',
          realmName: '$char.realmName',
          level: '$char.level',
          className: '$char.className',
          faction: '$char.faction',
        },
      },
      { $sort: { name: 1 } },
    ]);
    res.json({ achievement: { achievementId, name: meta?.name || '', points: meta?.points }, characters });
  } catch (err) {
    next(err);
  }
}

// GET /api/quests  (requireAuth)
export async function getAllQuests(req, res, next) {
  try {
    const quests = await CharacterQuest.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$questId', characterCount: { $sum: 1 } } },
      {
        $lookup: {
          from: QuestMeta.collection.name,
          localField: '_id',
          foreignField: 'questId',
          as: 'meta',
        },
      },
      { $unwind: { path: '$meta', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          questId: '$_id',
          name: { $ifNull: ['$meta.name', ''] },
          characterCount: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);
    res.json({ quests });
  } catch (err) {
    next(err);
  }
}

// GET /api/quests/:questId/characters  (requireAuth)
export async function getQuestCharacters(req, res, next) {
  try {
    const questId = Number(req.params.questId);
    const meta = await QuestMeta.findOne({ questId }).lean();
    const characters = await CharacterQuest.aggregate([
      { $match: { userId: req.user._id, questId } },
      {
        $lookup: {
          from: Character.collection.name,
          localField: 'characterId',
          foreignField: '_id',
          as: 'char',
        },
      },
      { $unwind: '$char' },
      {
        $project: {
          _id: 0,
          id: '$char._id',
          name: '$char.name',
          realmName: '$char.realmName',
          level: '$char.level',
          className: '$char.className',
          faction: '$char.faction',
        },
      },
      { $sort: { name: 1 } },
    ]);
    res.json({ quest: { questId, name: meta?.name || '' }, characters });
  } catch (err) {
    next(err);
  }
}
