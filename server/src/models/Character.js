import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    blizzardId: { type: Number, default: null }, // character id from Blizzard
    name: { type: String, required: true },
    realmSlug: { type: String, required: true },
    realmName: { type: String, default: '' },
    region: { type: String, default: 'us' },

    // Basic stats available from the account profile summary.
    level: { type: Number, default: null },
    className: { type: String, default: '' },
    raceName: { type: String, default: '' },
    faction: { type: String, default: '' },
    gender: { type: String, default: '' },

    // Populated by the deeper per-character sync in later milestones.
    renderImageUrl: { type: String, default: '' },
    itemLevel: { type: Number, default: null },
    guildName: { type: String, default: '' },

    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One document per character per user.
characterSchema.index({ userId: 1, region: 1, realmSlug: 1, name: 1 }, { unique: true });

characterSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    blizzardId: this.blizzardId,
    name: this.name,
    realmSlug: this.realmSlug,
    realmName: this.realmName,
    region: this.region,
    level: this.level,
    className: this.className,
    raceName: this.raceName,
    faction: this.faction,
    gender: this.gender,
    renderImageUrl: this.renderImageUrl,
    itemLevel: this.itemLevel,
    guildName: this.guildName,
    lastSyncedAt: this.lastSyncedAt,
  };
};

const Character = mongoose.model('Character', characterSchema);

export default Character;
