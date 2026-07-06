// Seed (or reset) the read-only demo account.
// Run with:  npm run seed --workspace server
import { connectDb, disconnectDb } from '../config/db.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/auth.js';

const DEMO_EMAIL = (process.env.DEMO_EMAIL || 'demo@wow-toon-data.app').toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demopass123';

async function run() {
  await connectDb();

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      $set: {
        passwordHash,
        displayName: 'Demo Explorer',
        isDemo: true,
        blizzardRegion: 'us',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`[seed] Demo account ready: ${user.email} (isDemo=${user.isDemo})`);
  console.log(`[seed] Password: ${DEMO_PASSWORD}`);
  // Character/achievement/quest demo data is seeded in later milestones.

  await disconnectDb();
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
