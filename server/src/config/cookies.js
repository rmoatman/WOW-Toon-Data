import { isProd } from './env.js';

export const AUTH_COOKIE = 'wtd_token';

// The API serves the SPA from the same origin, so the auth cookie is first-party:
// SameSite=Lax works in every browser (including Safari/iOS, which block
// third-party cookies) and still rides the top-level OAuth redirect. Secure in
// production (HTTPS); relaxed in dev over http.
export function authCookieOptions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  };
}
