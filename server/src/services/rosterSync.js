import Character from '../models/Character.js';
import { getAccountProfile, normalizeRoster } from './blizzard/profile.js';

/**
 * Fetch a user's roster from Blizzard and upsert it into the DB.
 * Characters no longer present on the account are removed.
 * @returns {Promise<{imported:number, removed:number}>}
 */
export async function syncRoster(user, userToken) {
  const region = user.blizzardRegion || 'us';
  const summary = await getAccountProfile(userToken, region);
  const roster = normalizeRoster(summary, region);

  const now = new Date();
  const seenKeys = new Set();

  for (const c of roster) {
    seenKeys.add(`${c.region}/${c.realmSlug}/${c.name.toLowerCase()}`);
    await Character.updateOne(
      { userId: user._id, region: c.region, realmSlug: c.realmSlug, name: c.name },
      { $set: { ...c, userId: user._id, lastSyncedAt: now } },
      { upsert: true }
    );
  }

  // Prune characters that are no longer on the account.
  const existing = await Character.find({ userId: user._id }).select('region realmSlug name');
  const toRemove = existing.filter(
    (doc) => !seenKeys.has(`${doc.region}/${doc.realmSlug}/${doc.name.toLowerCase()}`)
  );
  if (toRemove.length) {
    await Character.deleteMany({ _id: { $in: toRemove.map((d) => d._id) } });
  }

  return { imported: roster.length, removed: toRemove.length };
}
