import UserCollectible from '../models/UserCollectible.js';
import {
  getAccountMounts,
  getAccountPets,
  getAccountToys,
  normalizeMounts,
  normalizePets,
  normalizeToys,
} from './blizzard/profile.js';
import { seedPetDisplays } from './collectibleMedia.js';

// Upsert the desired set and prune collectibles the user no longer owns.
// Upsert (rather than insert-only) keeps mutable pet fields — level, nickname,
// favorite — fresh on re-sync.
async function reconcile(userId, type, desired) {
  const desiredIds = new Set(desired.map((d) => d.collectibleId));

  if (desired.length) {
    await UserCollectible.bulkWrite(
      desired.map((d) => ({
        updateOne: {
          filter: { userId, type, collectibleId: d.collectibleId },
          update: { $set: { ...d, userId, type } },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  const existing = await UserCollectible.find({ userId, type }).select('collectibleId');
  const toRemove = existing
    .filter((e) => !desiredIds.has(e.collectibleId))
    .map((e) => e.collectibleId);
  if (toRemove.length) {
    await UserCollectible.deleteMany({ userId, type, collectibleId: { $in: toRemove } });
  }

  return desiredIds.size;
}

/**
 * Sync a user's account-wide mount and pet collections. Tolerates a failure on
 * either endpoint (e.g. a private collection or a transient error). Returns the
 * counts synced, or null for an endpoint that failed.
 */
export async function syncCollections(user, userToken) {
  const region = user.blizzardRegion || 'us';
  const [mountsR, petsR, toysR] = await Promise.allSettled([
    getAccountMounts(userToken, region),
    getAccountPets(userToken, region),
    getAccountToys(userToken, region),
  ]);

  let mounts = null;
  let pets = null;
  let toys = null;
  if (mountsR.status === 'fulfilled') {
    mounts = await reconcile(user._id, 'mount', normalizeMounts(mountsR.value));
  }
  if (petsR.status === 'fulfilled') {
    const normalizedPets = normalizePets(petsR.value);
    pets = await reconcile(user._id, 'pet', normalizedPets);
    await seedPetDisplays(normalizedPets); // cache species -> display for images
  }
  if (toysR.status === 'fulfilled') {
    // Names/icons are resolved lazily (ToyMeta) when the Toys tab is opened.
    toys = await reconcile(user._id, 'toy', normalizeToys(toysR.value));
  }
  return { mounts, pets, toys };
}
