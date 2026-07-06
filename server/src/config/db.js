import mongoose from 'mongoose';
import env from './env.js';

mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB. Resolves once connected; throws on failure so the
 * caller can decide whether to exit the process.
 */
export async function connectDb() {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is not set. Copy server/.env.example to server/.env and fill it in.');
  }

  mongoose.connection.on('connected', () => {
    console.log('[db] MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
