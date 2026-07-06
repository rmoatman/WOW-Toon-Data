import User from '../models/User.js';
import Character from '../models/Character.js';
import CharacterAchievement from '../models/CharacterAchievement.js';
import CharacterQuest from '../models/CharacterQuest.js';
import env from '../config/env.js';
import { AUTH_COOKIE, authCookieOptions, clearCookieOptions } from '../config/cookies.js';
import {
  hashPassword,
  verifyPassword,
  signAuthToken,
  createResetToken,
  hashResetToken,
} from '../utils/auth.js';
import { isValidEmail, validatePassword, badRequest } from '../utils/validate.js';
import { sendPasswordReset } from '../services/mailer.js';

function issueSession(res, user) {
  const token = signAuthToken(user._id.toString());
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password, displayName } = req.body;

    if (!isValidEmail(email)) throw badRequest('Please enter a valid email address.');
    const pwError = validatePassword(password);
    if (pwError) throw badRequest(pwError);

    const existing = await User.findOne({ email });
    if (existing) throw badRequest('An account with that email already exists.');

    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      displayName: (displayName || '').trim(),
    });

    issueSession(res, user);
    res.status(201).json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!isValidEmail(email) || !password) {
      throw badRequest('Invalid email or password.');
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    // Always compare against something to reduce timing/user-enumeration signal.
    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) {
      const err = badRequest('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    issueSession(res, user);
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie(AUTH_COOKIE, clearCookieOptions());
  res.json({ ok: true });
}

// GET /api/auth/me  (requireAuth)
export async function me(req, res) {
  res.json({ user: req.user.toPublicJSON() });
}

// POST /api/auth/forgot-password
export async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) throw badRequest('Please enter a valid email address.');

    const user = await User.findOne({ email });
    // Only demo accounts and unknown emails are silently ignored — but we always
    // return the same response so we don't reveal whether an account exists.
    if (user && !user.isDemo) {
      const { raw, hash } = createResetToken();
      user.resetTokenHash = hash;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const base = env.clientUrls[0] || 'http://localhost:5173';
      const resetUrl = `${base}/reset-password?token=${raw}`;
      await sendPasswordReset(user.email, resetUrl);
    }

    res.json({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token) throw badRequest('Missing reset token.');
    const pwError = validatePassword(password);
    if (pwError) throw badRequest(pwError);

    const user = await User.findOne({
      resetTokenHash: hashResetToken(token),
      resetTokenExpires: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpires');

    if (!user) throw badRequest('This reset link is invalid or has expired.');

    user.passwordHash = await hashPassword(password);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    issueSession(res, user);
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/auth/account  (requireAuth)
export async function deleteAccount(req, res, next) {
  try {
    if (req.user.isDemo) {
      throw badRequest('The demo account cannot be deleted.');
    }
    await Promise.all([
      Character.deleteMany({ userId: req.user._id }),
      CharacterAchievement.deleteMany({ userId: req.user._id }),
      CharacterQuest.deleteMany({ userId: req.user._id }),
    ]);
    await User.deleteOne({ _id: req.user._id });
    res.clearCookie(AUTH_COOKIE, clearCookieOptions());
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
