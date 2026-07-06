import crypto from 'node:crypto';
import env from '../config/env.js';

// AES-256-GCM encryption for tokens at rest. The key is derived by SHA-256 of
// TOKEN_ENCRYPTION_KEY so any sufficiently random string works as the env value.
const KEY = crypto.createHash('sha256').update(env.tokenEncryptionKey || 'dev-key').digest();
const IV_LENGTH = 12;

export function encrypt(plain) {
  if (plain == null) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as iv.tag.ciphertext, all base64.
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decrypt(payload) {
  if (!payload) return null;
  try {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
