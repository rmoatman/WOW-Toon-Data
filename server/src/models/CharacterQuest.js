import mongoose from 'mongoose';

// One row per (character, completed quest). Powers the combined quest list
// and the reverse lookup (quest -> characters).
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true, index: true },
    questId: { type: Number, required: true },
  },
  { timestamps: false }
);

schema.index({ characterId: 1, questId: 1 }, { unique: true });
schema.index({ userId: 1, questId: 1 });

export default mongoose.model('CharacterQuest', schema);
