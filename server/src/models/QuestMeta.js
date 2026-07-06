import mongoose from 'mongoose';

// Global cache of quest metadata (shared across all users). Name comes free
// from the completed-quests response.
const schema = new mongoose.Schema(
  {
    questId: { type: Number, required: true, unique: true },
    name: { type: String, default: '' },
    category: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('QuestMeta', schema);
