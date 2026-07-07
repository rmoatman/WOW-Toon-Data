import { blizzardGet } from './client.js';
import { regionConfig } from './regions.js';

/**
 * Fetch the account profile summary for a user (their full WoW roster).
 * Requires a user access token with the wow.profile scope.
 */
export async function getAccountProfile(userToken, region = 'us') {
  const { profileNamespace } = regionConfig(region);
  return blizzardGet('/profile/user/wow', {
    token: userToken,
    region,
    namespace: profileNamespace,
  });
}

/**
 * Fetch the account-wide mount collection for a user.
 * Requires a user access token with the wow.profile scope.
 */
export function getAccountMounts(userToken, region = 'us') {
  const { profileNamespace } = regionConfig(region);
  return blizzardGet('/profile/user/wow/collections/mounts', {
    token: userToken,
    region,
    namespace: profileNamespace,
  });
}

/**
 * Fetch the account-wide battle pet collection for a user.
 * Requires a user access token with the wow.profile scope.
 */
export function getAccountPets(userToken, region = 'us') {
  const { profileNamespace } = regionConfig(region);
  return blizzardGet('/profile/user/wow/collections/pets', {
    token: userToken,
    region,
    namespace: profileNamespace,
  });
}

// Static Game Data: a single mount entry (used to find its creature-display id).
export function getMount(region, mountId) {
  const { staticNamespace } = regionConfig(region);
  return blizzardGet(`/data/wow/mount/${mountId}`, { region, namespace: staticNamespace });
}

// Static Game Data: a battle-pet species (used to find its creature-display id
// when it wasn't captured from the account collection at sync time).
export function getPet(region, petSpeciesId) {
  const { staticNamespace } = regionConfig(region);
  return blizzardGet(`/data/wow/pet/${petSpeciesId}`, { region, namespace: staticNamespace });
}

// Static Game Data: the render assets for a creature-display id (shared by the
// mounts and pets that use it).
export function getCreatureDisplayMedia(region, displayId) {
  const { staticNamespace } = regionConfig(region);
  return blizzardGet(`/data/wow/media/creature-display/${displayId}`, {
    region,
    namespace: staticNamespace,
  });
}

// Blizzard character paths require a lowercased, URL-encoded character name.
function characterBase(realmSlug, name) {
  return `/profile/wow/character/${realmSlug}/${encodeURIComponent(name.toLowerCase())}`;
}

export function getCharacterSummary(region, realmSlug, name) {
  return blizzardGet(characterBase(realmSlug, name), { region });
}

export function getCharacterMedia(region, realmSlug, name) {
  return blizzardGet(`${characterBase(realmSlug, name)}/character-media`, { region });
}

export function getCharacterAchievements(region, realmSlug, name) {
  return blizzardGet(`${characterBase(realmSlug, name)}/achievements`, { region });
}

export function getCharacterQuestsCompleted(region, realmSlug, name) {
  return blizzardGet(`${characterBase(realmSlug, name)}/quests/completed`, { region });
}

// Pull an image URL out of the media assets list by key (avatar, inset, main-raw).
export function pickMediaAsset(media, key) {
  const asset = (media?.assets || []).find((a) => a.key === key);
  return asset?.value || '';
}

// Capitalize a realm slug fallback like "argent-dawn" -> "Argent Dawn".
function titleFromSlug(slug = '') {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

/**
 * Flatten a Blizzard account profile summary into plain character records
 * ready to upsert. Skips entries missing a realm slug or name.
 */
export function normalizeRoster(summary, region = 'us') {
  const characters = [];
  const accounts = summary?.wow_accounts || [];
  for (const account of accounts) {
    for (const c of account.characters || []) {
      const realmSlug = c.realm?.slug;
      if (!realmSlug || !c.name) continue;
      characters.push({
        blizzardId: c.id ?? null,
        name: c.name,
        realmSlug,
        realmName: c.realm?.name || titleFromSlug(realmSlug),
        region,
        level: c.level ?? null,
        className: c.playable_class?.name || '',
        raceName: c.playable_race?.name || '',
        faction: c.faction?.name || '',
        gender: c.gender?.name || '',
      });
    }
  }
  return characters;
}

/**
 * Flatten a mount collection summary into plain records.
 * A mount id is unique per mount type. Skips entries missing an id.
 */
export function normalizeMounts(summary) {
  return (summary?.mounts || [])
    .map((m) => ({
      collectibleId: m.mount?.id,
      name: m.mount?.name || '',
      isFavorite: Boolean(m.is_favorite),
    }))
    .filter((m) => m.collectibleId != null);
}

/**
 * Flatten a pet collection summary into plain records. Each collected pet has a
 * unique instance id, so duplicates of the same species are kept separately.
 * Skips entries missing an instance id.
 */
export function normalizePets(summary) {
  return (summary?.pets || [])
    .map((p) => ({
      collectibleId: p.id,
      speciesId: p.species?.id ?? null,
      name: p.species?.name || '',
      nickname: p.name || '', // player-assigned custom name, if any
      level: p.level ?? null,
      quality: p.quality?.name || '',
      isFavorite: Boolean(p.is_favorite),
      // Creature-display id drives the pet render; shared by all pets of a species.
      displayId: p.creature_display?.id ?? null,
    }))
    .filter((p) => p.collectibleId != null);
}
