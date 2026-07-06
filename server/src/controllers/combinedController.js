import Character from '../models/Character.js';
import CharacterAchievement from '../models/CharacterAchievement.js';
import CharacterQuest from '../models/CharacterQuest.js';
import AchievementMeta from '../models/AchievementMeta.js';
import QuestMeta from '../models/QuestMeta.js';

// Blizzard reuses the same display name across different achievement/quest IDs
// (e.g. Raid vs Remix variants). We group by name so each shows once, and
// count DISTINCT characters (a character that has two same-named IDs counts once).

// GET /api/achievements  (requireAuth)
export async function getAllAchievements(req, res, next) {
  try {
    const achievements = await CharacterAchievement.aggregate([
      { $match: { userId: req.user._id } },
      {
        $lookup: {
          from: AchievementMeta.collection.name,
          localField: 'achievementId',
          foreignField: 'achievementId',
          as: 'meta',
        },
      },
      { $unwind: { path: '$meta', preserveNullAndEmptyArrays: true } },
      { $addFields: { _name: { $ifNull: ['$meta.name', ''] } } },
      {
        $group: {
          _id: {
            $cond: [{ $gt: ['$_name', ''] }, '$_name', { $concat: ['#', { $toString: '$achievementId' }] }],
          },
          name: { $first: '$_name' },
          achievementId: { $first: '$achievementId' },
          points: { $first: '$meta.points' },
          chars: { $addToSet: '$characterId' },
        },
      },
      { $project: { _id: 0, name: 1, achievementId: 1, points: 1, characterCount: { $size: '$chars' } } },
      { $sort: { name: 1 } },
    ]);
    res.json({ achievements });
  } catch (err) {
    next(err);
  }
}

// GET /api/achievements/:achievementId/characters  (requireAuth)
export async function getAchievementCharacters(req, res, next) {
  try {
    const achievementId = Number(req.params.achievementId);
    const meta = await AchievementMeta.findOne({ achievementId }).lean();
    const name = meta?.name || '';
    // Resolve every sibling id that shares this name.
    const ids = name
      ? (await AchievementMeta.find({ name }).select('achievementId').lean()).map((m) => m.achievementId)
      : [achievementId];

    const characters = await CharacterAchievement.aggregate([
      { $match: { userId: req.user._id, achievementId: { $in: ids } } },
      { $group: { _id: '$characterId', completedAt: { $min: '$completedAt' } } },
      {
        $lookup: {
          from: Character.collection.name,
          localField: '_id',
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
    res.json({ achievement: { achievementId, name, points: meta?.points }, characters });
  } catch (err) {
    next(err);
  }
}

// GET /api/quests  (requireAuth)
export async function getAllQuests(req, res, next) {
  try {
    const quests = await CharacterQuest.aggregate([
      { $match: { userId: req.user._id } },
      {
        $lookup: {
          from: QuestMeta.collection.name,
          localField: 'questId',
          foreignField: 'questId',
          as: 'meta',
        },
      },
      { $unwind: { path: '$meta', preserveNullAndEmptyArrays: true } },
      { $addFields: { _name: { $ifNull: ['$meta.name', ''] } } },
      {
        $group: {
          _id: {
            $cond: [{ $gt: ['$_name', ''] }, '$_name', { $concat: ['#', { $toString: '$questId' }] }],
          },
          name: { $first: '$_name' },
          questId: { $first: '$questId' },
          chars: { $addToSet: '$characterId' },
        },
      },
      { $project: { _id: 0, name: 1, questId: 1, characterCount: { $size: '$chars' } } },
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
    const name = meta?.name || '';
    const ids = name
      ? (await QuestMeta.find({ name }).select('questId').lean()).map((m) => m.questId)
      : [questId];

    const characters = await CharacterQuest.aggregate([
      { $match: { userId: req.user._id, questId: { $in: ids } } },
      { $group: { _id: '$characterId' } },
      {
        $lookup: {
          from: Character.collection.name,
          localField: '_id',
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
    res.json({ quest: { questId, name }, characters });
  } catch (err) {
    next(err);
  }
}
