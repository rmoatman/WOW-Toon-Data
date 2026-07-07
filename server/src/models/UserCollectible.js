import mongoose from 'mongoose';

// One row per collected mount or pet. Mounts and pets are account-wide in WoW,
// so these are scoped to the user (not to a character). Powers the Collections
// page. Pet-only fields (speciesId, nickname, level, quality) stay empty/null
// for mounts.
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['mount', 'pet', 'toy'], required: true },
    collectibleId: { type: Number, required: true }, // mount id, pet instance id, or toy id
    speciesId: { type: Number, default: null }, // pets only
    name: { type: String, default: '' },
    nickname: { type: String, default: '' }, // pets only
    level: { type: Number, default: null }, // pets only
    quality: { type: String, default: '' }, // pets only
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: false }
);

// One document per collectible per user.
schema.index({ userId: 1, type: 1, collectibleId: 1 }, { unique: true });

export default mongoose.model('UserCollectible', schema);
