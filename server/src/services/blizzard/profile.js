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
