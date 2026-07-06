import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env, { isProd } from '../config/env.js';
import User from '../models/User.js';
import { badRequest } from '../utils/validate.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { buildAuthorizeUrl, exchangeCodeForToken, getUserInfo } from '../services/blizzard/oauth.js';
import { syncRoster } from '../services/rosterSync.js';

const OAUTH_STATE_COOKIE = 'wtd_oauth_state';

function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: '/',
  };
}

function credentialsConfigured() {
  return Boolean(env.blizzard.clientId && env.blizzard.clientSecret && env.blizzard.redirectUri);
}

function clientBase() {
  return env.clientUrls[0] || 'http://localhost:5173';
}

// GET /api/blizzard/authorize  (requireAuth)
// Kicks off the OAuth flow: sign a state token binding the request to this user.
export function authorize(req, res, next) {
  try {
    if (!credentialsConfigured()) {
      throw badRequest('Blizzard API credentials are not configured on the server.');
    }
    const nonce = crypto.randomBytes(16).toString('hex');
    const state = jwt.sign({ sub: req.user._id.toString(), nonce }, env.jwtSecret, {
      expiresIn: '10m',
    });
    res.cookie(OAUTH_STATE_COOKIE, nonce, stateCookieOptions());
    res.json({ url: buildAuthorizeUrl(state, req.user.blizzardRegion || env.blizzard.region) });
  } catch (err) {
    next(err);
  }
}

// GET /api/blizzard/callback
// Blizzard redirects here. Validate state, exchange the code, import the roster,
// then bounce back to the client dashboard.
export async function callback(req, res) {
  const redirect = (params) => res.redirect(`${clientBase()}/dashboard?${new URLSearchParams(params)}`);
  try {
    const { code, state, error } = req.query;
    if (error) return redirect({ linked: 'error', reason: String(error) });
    if (!code || !state) return redirect({ linked: 'error', reason: 'missing_code' });

    let payload;
    try {
      payload = jwt.verify(state, env.jwtSecret);
    } catch {
      return redirect({ linked: 'error', reason: 'bad_state' });
    }
    // CSRF: the nonce in the signed state must match the cookie we set.
    if (!req.cookies?.[OAUTH_STATE_COOKIE] || req.cookies[OAUTH_STATE_COOKIE] !== payload.nonce) {
      return redirect({ linked: 'error', reason: 'state_mismatch' });
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { ...stateCookieOptions(), maxAge: undefined });

    const user = await User.findById(payload.sub);
    if (!user) return redirect({ linked: 'error', reason: 'no_user' });

    const region = user.blizzardRegion || env.blizzard.region;
    const token = await exchangeCodeForToken(code, region);
    const accessToken = token.access_token;

    const info = await getUserInfo(accessToken, region).catch(() => ({}));

    user.battletag = info.battletag || user.battletag || null;
    user.blizzardUserId = info.id ? String(info.id) : user.blizzardUserId;
    user.blizzardAccessToken = encrypt(accessToken);
    user.blizzardTokenExpires = new Date(Date.now() + (token.expires_in || 86399) * 1000);
    await user.save();

    const result = await syncRoster(user, accessToken);
    return redirect({ linked: 'success', imported: String(result.imported) });
  } catch (err) {
    console.error('[blizzard callback]', err.response?.data || err.message);
    return redirect({ linked: 'error', reason: 'sync_failed' });
  }
}

// POST /api/blizzard/resync  (requireAuth)
// Re-import the roster using the stored user token (valid ~24h after linking).
export async function resync(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select(
      '+blizzardAccessToken +blizzardTokenExpires'
    );
    if (!user.battletag) throw badRequest('Battle.net account is not linked.');

    const token = decrypt(user.blizzardAccessToken);
    if (!token || !user.blizzardTokenExpires || user.blizzardTokenExpires < new Date()) {
      const err = badRequest('Your Battle.net session has expired. Please reconnect.');
      err.status = 409;
      throw err;
    }

    const result = await syncRoster(user, token);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.response) {
      return next(badRequest('Could not reach the Blizzard API. Please try reconnecting.'));
    }
    next(err);
  }
}

// POST /api/blizzard/unlink  (requireAuth)
export async function unlink(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    user.battletag = null;
    user.blizzardUserId = null;
    user.blizzardAccessToken = null;
    user.blizzardTokenExpires = null;
    await user.save();
    // Characters are removed here; achievement/quest cleanup joins in later milestones.
    const { default: Character } = await import('../models/Character.js');
    await Character.deleteMany({ userId: user._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// GET /api/blizzard/status  (requireAuth)
export function status(req, res) {
  res.json({
    configured: credentialsConfigured(),
    linked: Boolean(req.user.battletag),
    battletag: req.user.battletag,
    region: req.user.blizzardRegion || env.blizzard.region,
  });
}
