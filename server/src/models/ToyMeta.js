import mongoose from 'mongoose';

// Global (shared across all users) cache of toy metadata. The account toys
// collection returns only ids, so we resolve each toy's name and item-media id
// from the toy game-data endpoint once and reuse it for everyone.
const schema = new mongoose.Schema(
  {
    toyId: { type: Number, required: true, unique: true },
    name: { type: String, default: '' },
    mediaId: { type: Number, default: null }, // item id for the icon media
  },
  { timestamps: true }
);

export default mongoose.model('ToyMeta', schema);
