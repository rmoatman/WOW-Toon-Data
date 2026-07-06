import axios from 'axios';
import env from '../../config/env.js';
import { regionConfig } from './regions.js';

// Cached app-level (client credentials) token, used for public profile/game data.
let appToken = null;
let appTokenExpires = 0;

export async function getClientToken(region = env.blizzard.region) {
  const now = Date.now();
  if (appToken && now < appTokenExpires - 60_000) return appToken;

  const { oauthHost } = regionConfig(region);
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const res = await axios.post(`${oauthHost}/token`, body.toString(), {
    auth: { username: env.blizzard.clientId, password: env.blizzard.clientSecret },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  appToken = res.data.access_token;
  appTokenExpires = now + res.data.expires_in * 1000;
  return appToken;
}

/**
 * GET a Blizzard API resource.
 * @param {string} path e.g. /profile/user/wow
 * @param {object} opts { token, region, namespace, params }
 *   token   – a user access token (for /profile/user/*); omit to use the app token
 *   namespace – e.g. profile-us, static-us
 */
export async function blizzardGet(path, { token, region = env.blizzard.region, namespace, params = {} } = {}) {
  const cfg = regionConfig(region);
  const accessToken = token || (await getClientToken(region));
  const res = await axios.get(`${cfg.apiHost}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      namespace: namespace || cfg.profileNamespace,
      locale: cfg.locale,
      ...params,
    },
  });
  return res.data;
}

// Test-only reset hook.
export function _resetTokenCache() {
  appToken = null;
  appTokenExpires = 0;
}
