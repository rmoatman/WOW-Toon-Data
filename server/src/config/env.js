import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load server/.env regardless of the process's current working directory
// (this file lives at server/src/config/env.js, so go up three levels).
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverRoot, '.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || '',
  email: {
    host: process.env.EMAIL_HOST || '',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'WOW-Toon-Data <no-reply@wow-toon-data.app>',
  },
  blizzard: {
    clientId: process.env.BLIZZARD_CLIENT_ID || '',
    clientSecret: process.env.BLIZZARD_CLIENT_SECRET || '',
    redirectUri: process.env.BLIZZARD_REDIRECT_URI || '',
    region: process.env.BLIZZARD_REGION || 'us',
  },
};

export const isProd = env.nodeEnv === 'production';

export default env;
