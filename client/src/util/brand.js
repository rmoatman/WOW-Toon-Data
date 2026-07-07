import { SITE } from '../config.js';

// Possessive prefix for the signed-in user, e.g. "Raemarie's " — empty when
// logged out. Falls back to the email local part if no display name is set.
export function ownerPrefix(user) {
  const name = user?.displayName || user?.email?.split('@')[0] || '';
  return name ? `${name}'s ` : '';
}

// Full branded title as a plain string, e.g. "Raemarie's Toons and Other WoW Stuff".
export function brandName(user) {
  return `${ownerPrefix(user)}${SITE.name}`;
}
