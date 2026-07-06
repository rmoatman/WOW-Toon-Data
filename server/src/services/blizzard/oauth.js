import axios from 'axios';
import env from '../../config/env.js';
import { regionConfig, OAUTH_SCOPES } from './regions.js';

// Build the URL we redirect the user to so they can authorize on Battle.net.
export function buildAuthorizeUrl(state, region = env.blizzard.region) {
  const { oauthHost } = regionConfig(region);
  const params = new URLSearchParams({
    client_id: env.blizzard.clientId,
    scope: OAUTH_SCOPES,
    state,
    redirect_uri: env.blizzard.redirectUri,
    response_type: 'code',
  });
  return `${oauthHost}/authorize?${params.toString()}`;
}

// Exchange an authorization code for a user access token.
export async function exchangeCodeForToken(code, region = env.blizzard.region) {
  const { oauthHost } = regionConfig(region);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.blizzard.redirectUri,
  });
  const res = await axios.post(`${oauthHost}/token`, body.toString(), {
    auth: { username: env.blizzard.clientId, password: env.blizzard.clientSecret },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data; // { access_token, token_type, expires_in, scope, ... }
}

// Fetch the authenticated user's Battle.net identity (battletag).
export async function getUserInfo(accessToken, region = env.blizzard.region) {
  const { oauthHost } = regionConfig(region);
  const res = await axios.get(`${oauthHost}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data; // { sub, id, battletag }
}
