import mongoose from 'mongoose';

// Global (shared across all users) cache of collectible render images. A mount
// or pet species maps to a creature-display id, which maps to a render URL on
// Blizzard's CDN. Resolving is lazy: rows are seeded with a displayId when known
// (pets, at sync) and the imageUrl is filled on first request. A row is treated
// as resolved once imageUrl is set; an empty imageUrl is retried on next request.
const schema = new mongoose.Schema(
  {
    type: { type: String, enum: ['mount', 'pet'], required: true },
    refId: { type: Number, required: true }, // mountId, or pet speciesId
    displayId: { type: Number, default: null }, // creature-display id
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

schema.index({ type: 1, refId: 1 }, { unique: true });

export default mongoose.model('CollectibleMedia', schema);
