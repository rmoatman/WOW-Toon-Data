import CollectibleMedia from '../models/CollectibleMedia.js';
import {
  getMount,
  getPet,
  getCreatureDisplayMedia,
  pickMediaAsset,
} from './blizzard/profile.js';

// Look up the creature-display id for a collectible we don't have one cached for.
//  - mount: read it from the mount's game-data entry.
//  - pet:   read it from the pet species' game-data entry (a fallback for when
//           the account collection didn't include creature_display at sync time).
async function lookupDisplayId(type, refId, region) {
  if (type === 'mount') {
    const mount = await getMount(region, refId);
    return mount?.creature_displays?.[0]?.id ?? null;
  }
  const pet = await getPet(region, refId);
  return pet?.creature_display?.id ?? null;
}

/**
 * Resolve a collectible's render URL, caching the result globally. refId is a
 * mount id (mounts) or a pet species id (pets). Cached on image presence, so a
 * row that resolved empty (or predates a fix) is retried on the next request;
 * once an image is found it's cached permanently. Returns '' when none exists.
 */
export async function resolveMedia(type, refIdRaw, region = 'us') {
  const refId = Number(refIdRaw);
  if (!Number.isFinite(refId)) return '';

  const row = await CollectibleMedia.findOne({ type, refId });
  if (row?.imageUrl) return row.imageUrl; // trust any cached hit

  let displayId = row?.displayId ?? null;
  if (displayId == null) {
    displayId = await lookupDisplayId(type, refId, region);
  }

  let imageUrl = '';
  if (displayId != null) {
    const media = await getCreatureDisplayMedia(region, displayId);
    imageUrl = pickMediaAsset(media, 'zoom') || pickMediaAsset(media, 'icon') || '';
  }

  await CollectibleMedia.updateOne(
    { type, refId },
    { $set: { displayId, imageUrl } },
    { upsert: true }
  );
  return imageUrl;
}

/**
 * Seed the global cache with pet species -> creature-display ids gathered during
 * a collection sync (they come free in the pets response). Does not overwrite an
 * already-resolved imageUrl.
 */
export async function seedPetDisplays(pets) {
  const seen = new Set();
  const ops = [];
  for (const p of pets) {
    if (p.speciesId == null || p.displayId == null || seen.has(p.speciesId)) continue;
    seen.add(p.speciesId);
    ops.push({
      updateOne: {
        filter: { type: 'pet', refId: p.speciesId },
        update: { $set: { displayId: p.displayId }, $setOnInsert: { imageUrl: '' } },
        upsert: true,
      },
    });
  }
  if (ops.length) await CollectibleMedia.bulkWrite(ops, { ordered: false });
}
