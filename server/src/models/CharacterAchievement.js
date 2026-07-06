import mongoose from 'mongoose';

// One row per (character, completed achievement). Powers the combined
// achievement list and the reverse lookup (achievement -> characters).
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true, index: true },
    achievementId: { type: Number, required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

schema.index({ characterId: 1, achievementId: 1 }, { unique: true });
schema.index({ userId: 1, achievementId: 1 });

export default mongoose.model('CharacterAchievement', schema);
