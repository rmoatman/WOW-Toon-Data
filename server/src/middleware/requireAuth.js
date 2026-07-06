import { AUTH_COOKIE } from '../config/cookies.js';
import { verifyAuthToken } from '../utils/auth.js';
import User from '../models/User.js';

// Populates req.user from the auth cookie, or responds 401.
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}
