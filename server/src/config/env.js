import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || '',
  blizzard: {
    clientId: process.env.BLIZZARD_CLIENT_ID || '',
    clientSecret: process.env.BLIZZARD_CLIENT_SECRET || '',
    redirectUri: process.env.BLIZZARD_REDIRECT_URI || '',
    region: process.env.BLIZZARD_REGION || 'us',
  },
};

export const isProd = env.nodeEnv === 'production';

export default env;
