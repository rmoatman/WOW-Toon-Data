// Snapshot a real account's data into the read-only demo account, so portfolio
// visitors see a fully-populated app.
//
// Run with:
//   SNAPSHOT_SOURCE_EMAIL=you@example.com npm run snapshot --workspace server
//
// Copies characters (skipping hidden ones), their achievements/quests, and the
// account-wide collections. Character/quest/achievement IDs are remapped to the
// demo's new character documents. Global metadata caches (names, media) are
// already shared, so nothing to copy there. Re-running replaces the demo data.
import { connectDb, disconnectDb } from '../config/db.js';
import User from '../models/User.js';
import Character from '../models/Character.js';
import CharacterAchievement from '../models/CharacterAchievement.js';
import CharacterQuest from '../models/CharacterQuest.js';
import UserCollectible from '../models/UserCollectible.js';
import { hashPassword } from '../utils/auth.js';

const DEMO_EMAIL = (process.env.DEMO_EMAIL || 'demo@wow-toon-data.app').toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demopass123';
const SOURCE_EMAIL = (process.env.SNAPSHOT_SOURCE_EMAIL || '').toLowerCase();

// Strip Mongo bookkeeping fields before re-inserting as a new document.
function strip(doc) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc; // eslint-disable-line no-unused-vars
  return rest;
}

async function run() {
  if (!SOURCE_EMAIL) {
    console.error(
      '[snapshot] Set SNAPSHOT_SOURCE_EMAIL to the account whose data should populate the demo.'
    );
    process.exit(1);
  }

  await connectDb();

  const source = await User.findOne({ email: SOURCE_EMAIL });
  if (!source) {
    console.error(`[snapshot] Source account not found: ${SOURCE_EMAIL}`);
    await disconnectDb();
    process.exit(1);
  }

  // Upsert the demo user (read-only). Give it a friendly "linked" label so the
  // dashboard shows the connected state (mutations are blocked for isDemo).
  const demo = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      $set: {
        passwordHash: await hashPassword(DEMO_PASSWORD),
        displayName: 'Demo',
        isDemo: true,
        blizzardRegion: source.blizzardRegion || 'us',
        battletag: 'Demo Explorer',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Clean slate for the demo's data.
  await Promise.all([
    Character.deleteMany({ userId: demo._id }),
    CharacterAchievement.deleteMany({ userId: demo._id }),
    CharacterQuest.deleteMany({ userId: demo._id }),
    UserCollectible.deleteMany({ userId: demo._id }),
  ]);

  // Characters (skip the source's hidden ones). insertMany preserves order, so
  // we can map source _id -> new demo _id positionally.
  const srcChars = await Character.find({ userId: source._id, hidden: { $ne: true } }).lean();
  const insertedChars = srcChars.length
    ? await Character.insertMany(srcChars.map((c) => ({ ...strip(c), userId: demo._id, hidden: false })))
    : [];
  const idMap = new Map();
  srcChars.forEach((c, i) => idMap.set(String(c._id), insertedChars[i]._id));
  const srcCharIds = srcChars.map((c) => c._id);

  // Achievements -> remap characterId.
  const srcAch = await CharacterAchievement.find({
    userId: source._id,
    characterId: { $in: srcCharIds },
  }).lean();
  const demoAch = srcAch
    .filter((a) => idMap.has(String(a.characterId)))
    .map((a) => ({
      userId: demo._id,
      characterId: idMap.get(String(a.characterId)),
      achievementId: a.achievementId,
      completedAt: a.completedAt,
    }));
  if (demoAch.length) await CharacterAchievement.insertMany(demoAch, { ordered: false });

  // Quests -> remap characterId.
  const srcQuests = await CharacterQuest.find({
    userId: source._id,
    characterId: { $in: srcCharIds },
  }).lean();
  const demoQuests = srcQuests
    .filter((q) => idMap.has(String(q.characterId)))
    .map((q) => ({
      userId: demo._id,
      characterId: idMap.get(String(q.characterId)),
      questId: q.questId,
    }));
  if (demoQuests.length) await CharacterQuest.insertMany(demoQuests, { ordered: false });

  // Collections (account-wide) -> just re-owner to the demo user.
  const srcCol = await UserCollectible.find({ userId: source._id }).lean();
  const demoCol = srcCol.map((c) => ({ ...strip(c), userId: demo._id }));
  if (demoCol.length) await UserCollectible.insertMany(demoCol, { ordered: false });

  console.log(
    `[snapshot] Demo ready: ${insertedChars.length} characters, ${demoAch.length} achievements, ` +
      `${demoQuests.length} quests, ${demoCol.length} collectibles.`
  );
  console.log(`[snapshot] Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  await disconnectDb();
}

run().catch((err) => {
  console.error('[snapshot] Failed:', err);
  process.exit(1);
});
