import CollectibleMedia from '../models/CollectibleMedia.js';
import ToyMeta from '../models/ToyMeta.js';
import {
  getMount,
  getPet,
  getToy,
  getItemMedia,
  getCreatureDisplayMedia,
  pickMediaAsset,
} from './blizzard/profile.js';

// Run an async worker over items with a small concurrency cap so we don't hammer
// the API. Failures resolve to null rather than aborting the batch.
async function mapPool(items, worker, concurrency = 6) {
  const results = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx]);
      } catch {
        results[idx] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

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
 * Resolve toy metadata (name + item-media id) for a set of toy ids, caching in
 * ToyMeta. Ids already cached are read from the DB; the rest are fetched from
 * the toy game-data endpoint (with a concurrency cap) and upserted. Returns a
 * Map of toyId -> { toyId, name, mediaId } for every id we could resolve.
 */
export async function resolveToyMeta(toyIds, region = 'us') {
  const ids = [...new Set(toyIds.map(Number).filter(Number.isFinite))];
  const existing = await ToyMeta.find({ toyId: { $in: ids } }).lean();
  const map = new Map(existing.map((m) => [m.toyId, m]));

  const missing = ids.filter((id) => !map.has(id));
  if (missing.length) {
    const fetched = await mapPool(missing, async (id) => {
      const toy = await getToy(region, id);
      return {
        toyId: id,
        name: toy?.item?.name || '',
        mediaId: toy?.media?.id ?? toy?.item?.id ?? null,
      };
    });
    const docs = fetched.filter((d) => d && (d.name || d.mediaId != null));
    if (docs.length) {
      await ToyMeta.bulkWrite(
        docs.map((d) => ({
          updateOne: { filter: { toyId: d.toyId }, update: { $set: d }, upsert: true },
        })),
        { ordered: false }
      );
      for (const d of docs) map.set(d.toyId, d);
    }
  }
  return map;
}

/**
 * Resolve a collectible's image URL, caching the result globally. refId is a
 * mount id (mounts), pet species id (pets), or toy id (toys). Mounts/pets use a
 * creature-display render; toys use the item icon. Cached on image presence, so
 * a row that resolved empty (or predates a fix) is retried on the next request;
 * once an image is found it's cached permanently. Returns '' when none exists.
 */
export async function resolveMedia(type, refIdRaw, region = 'us') {
  const refId = Number(refIdRaw);
  if (!Number.isFinite(refId)) return '';

  const row = await CollectibleMedia.findOne({ type, refId });
  if (row?.imageUrl) return row.imageUrl; // trust any cached hit

  let displayId = row?.displayId ?? null;
  let imageUrl = '';

  if (type === 'toy') {
    const mediaId = (await resolveToyMeta([refId], region)).get(refId)?.mediaId ?? null;
    if (mediaId != null) {
      const media = await getItemMedia(region, mediaId);
      imageUrl = pickMediaAsset(media, 'icon') || '';
    }
  } else {
    if (displayId == null) displayId = await lookupDisplayId(type, refId, region);
    if (displayId != null) {
      const media = await getCreatureDisplayMedia(region, displayId);
      imageUrl = pickMediaAsset(media, 'zoom') || pickMediaAsset(media, 'icon') || '';
    }
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
