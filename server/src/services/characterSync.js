import Character from '../models/Character.js';
import CharacterAchievement from '../models/CharacterAchievement.js';
import CharacterQuest from '../models/CharacterQuest.js';
import AchievementMeta from '../models/AchievementMeta.js';
import QuestMeta from '../models/QuestMeta.js';
import {
  getCharacterSummary,
  getCharacterMedia,
  getCharacterAchievements,
  getCharacterQuestsCompleted,
  pickMediaAsset,
} from './blizzard/profile.js';

export const DEEP_SYNC_STALE_MS = 15 * 60 * 1000; // 15 minutes

export function isDeepStale(character, now = Date.now()) {
  if (!character.lastDeepSyncedAt) return true;
  return now - new Date(character.lastDeepSyncedAt).getTime() > DEEP_SYNC_STALE_MS;
}

// Insert new join rows and delete ones no longer present — cheap on re-sync
// since only the delta changes.
async function reconcileJoin(Model, characterId, userId, desired, buildDoc) {
  const desiredIds = new Set(desired.map((d) => d.id));
  const existing = await Model.find({ characterId }).select(Model === CharacterAchievement ? 'achievementId' : 'questId');
  const key = Model === CharacterAchievement ? 'achievementId' : 'questId';
  const existingIds = new Set(existing.map((e) => e[key]));

  const toInsert = desired.filter((d) => !existingIds.has(d.id)).map((d) => buildDoc(d));
  const toRemove = [...existingIds].filter((id) => !desiredIds.has(id));

  if (toInsert.length) {
    await Model.insertMany(toInsert, { ordered: false }).catch((err) => {
      // Ignore duplicate-key races; rethrow anything else.
      if (err.code !== 11000) throw err;
    });
  }
  if (toRemove.length) {
    await Model.deleteMany({ characterId, [key]: { $in: toRemove } });
  }
  return desiredIds.size;
}

// Upsert only metadata ids we haven't cached yet (names are shared globally).
async function cacheMeta(Model, key, items) {
  if (!items.length) return;
  const ids = items.map((i) => i.id);
  const existing = await Model.find({ [key]: { $in: ids } }).select(key);
  const have = new Set(existing.map((e) => e[key]));
  const missing = items.filter((i) => !have.has(i.id)).map((i) => ({ [key]: i.id, name: i.name || '' }));
  if (missing.length) {
    await Model.insertMany(missing, { ordered: false }).catch((err) => {
      if (err.code !== 11000) throw err;
    });
  }
}

/**
 * Deep-sync one character: summary, media, achievements, completed quests.
 * Tolerates a failure on any single endpoint. Returns a small summary.
 */
export async function deepSyncCharacter(character) {
  const { region, realmSlug, name } = character;
  const [summaryR, mediaR, achR, questR] = await Promise.allSettled([
    getCharacterSummary(region, realmSlug, name),
    getCharacterMedia(region, realmSlug, name),
    getCharacterAchievements(region, realmSlug, name),
    getCharacterQuestsCompleted(region, realmSlug, name),
  ]);

  const update = { lastDeepSyncedAt: new Date() };

  // Blizzard 404s characters that aren't currently indexed (low-level/inactive).
  update.profileAvailable = summaryR.status === 'fulfilled';

  if (summaryR.status === 'fulfilled') {
    const s = summaryR.value;
    update.level = s.level ?? character.level;
    update.itemLevel = s.equipped_item_level ?? null;
    update.achievementPoints = s.achievement_points ?? null;
    update.guildName = s.guild?.name || '';
    update.titleName = s.active_title?.name || '';
    update.faction = s.faction?.name || character.faction;
    update.className = s.character_class?.name || character.className;
    update.raceName = s.race?.name || character.raceName;
    if (s.last_login_timestamp) update.lastLoginAt = new Date(s.last_login_timestamp);
  }

  if (mediaR.status === 'fulfilled') {
    const m = mediaR.value;
    update.renderImageUrl = pickMediaAsset(m, 'avatar');
    update.insetImageUrl = pickMediaAsset(m, 'inset');
    update.mainImageUrl = pickMediaAsset(m, 'main-raw');
  }

  let achCount = character.achievementCount;
  if (achR.status === 'fulfilled') {
    const completed = (achR.value.achievements || [])
      .filter((a) => a.completed_timestamp)
      .map((a) => ({
        id: a.id ?? a.achievement?.id,
        name: a.achievement?.name || '',
        completedAt: new Date(a.completed_timestamp),
      }))
      .filter((a) => a.id != null);

    await cacheMeta(AchievementMeta, 'achievementId', completed);
    achCount = await reconcileJoin(
      CharacterAchievement,
      character._id,
      character.userId,
      completed,
      (d) => ({
        userId: character.userId,
        characterId: character._id,
        achievementId: d.id,
        completedAt: d.completedAt,
      })
    );
    // Count distinct NAMES so Blizzard's same-named variants aren't double-counted.
    update.achievementCount = new Set(
      completed.map((a) => (a.name ? a.name.toLowerCase() : `#${a.id}`))
    ).size;
    achCount = update.achievementCount;
  }

  let questCount = character.questCount;
  if (questR.status === 'fulfilled') {
    const quests = (questR.value.quests || [])
      .map((q) => ({ id: q.id, name: q.name || '' }))
      .filter((q) => q.id != null);

    await cacheMeta(QuestMeta, 'questId', quests);
    questCount = await reconcileJoin(
      CharacterQuest,
      character._id,
      character.userId,
      quests,
      (d) => ({ userId: character.userId, characterId: character._id, questId: d.id })
    );
    update.questCount = new Set(quests.map((q) => (q.name ? q.name.toLowerCase() : `#${q.id}`))).size;
    questCount = update.questCount;
  }

  await Character.updateOne({ _id: character._id }, { $set: update });

  return {
    characterId: character._id.toString(),
    name: character.name,
    achievements: achCount,
    quests: questCount,
    errors: [summaryR, mediaR, achR, questR].filter((r) => r.status === 'rejected').length,
  };
}

// Run tasks with a small concurrency cap so we don't hammer the API.
async function pool(items, worker, concurrency = 3) {
  const results = [];
  let i = 0;
  async function next() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx]);
      } catch (err) {
        results[idx] = { characterId: items[idx]._id?.toString(), error: err.message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  return results;
}

/**
 * Deep-sync a user's characters. By default only stale ones; force syncs all.
 */
export async function syncCharacters(user, { force = false } = {}) {
  const all = await Character.find({ userId: user._id });
  const targets = force ? all : all.filter((c) => isDeepStale(c));
  if (!targets.length) return { synced: 0, skipped: all.length, results: [] };

  const results = await pool(targets, (c) => deepSyncCharacter(c));
  return { synced: targets.length, skipped: all.length - targets.length, results };
}
