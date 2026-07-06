import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import env from '../config/env.js';

const SALT_ROUNDS = 12;

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signAuthToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/**
 * Create a password-reset token. Returns the raw token (emailed to the user)
 * and its SHA-256 hash (stored in the DB), so a DB leak can't be used to reset.
 */
export function createResetToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = hashResetToken(raw);
  return { raw, hash };
}

export function hashResetToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
