import { isProd } from './env.js';

export const AUTH_COOKIE = 'wtd_token';

// In production the client and API live on different Render domains (cross-site),
// so cookies need SameSite=None + Secure. In dev the Vite proxy makes requests
// same-origin, so Lax over http works.
export function authCookieOptions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
}
