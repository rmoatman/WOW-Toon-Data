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
