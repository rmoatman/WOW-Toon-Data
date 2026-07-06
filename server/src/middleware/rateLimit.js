import rateLimit from 'express-rate-limit';

// Tighter limit on auth endpoints to slow credential stuffing / reset abuse.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});
