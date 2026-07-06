import mongoose from 'mongoose';

// Global cache of achievement metadata (shared across all users). Name comes
// free from the character achievements response; points/category can be
// enriched later from the Game Data API.
const schema = new mongoose.Schema(
  {
    achievementId: { type: Number, required: true, unique: true },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    points: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('AchievementMeta', schema);
