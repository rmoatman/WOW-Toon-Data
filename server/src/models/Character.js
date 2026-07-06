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

    // Populated by the deep per-character sync (M4).
    renderImageUrl: { type: String, default: '' }, // avatar (card thumbnail)
    insetImageUrl: { type: String, default: '' }, // inset (framed profile shot)
    mainImageUrl: { type: String, default: '' }, // main-raw (full-body render)
    itemLevel: { type: Number, default: null }, // equipped_item_level
    guildName: { type: String, default: '' },
    titleName: { type: String, default: '' },
    achievementPoints: { type: Number, default: null },
    achievementCount: { type: Number, default: 0 }, // # completed (denormalized)
    questCount: { type: Number, default: 0 }, // # completed (denormalized)
    lastLoginAt: { type: Date, default: null },

    // False when Blizzard's Profile API returns 404 for this character
    // (typically low-level/inactive toons not yet indexed until they log in).
    profileAvailable: { type: Boolean, default: true },

    lastSyncedAt: { type: Date, default: null }, // roster-listing sync
    lastDeepSyncedAt: { type: Date, default: null }, // achievements/quests/media sync
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
    insetImageUrl: this.insetImageUrl,
    mainImageUrl: this.mainImageUrl,
    itemLevel: this.itemLevel,
    guildName: this.guildName,
    titleName: this.titleName,
    achievementPoints: this.achievementPoints,
    achievementCount: this.achievementCount,
    questCount: this.questCount,
    profileAvailable: this.profileAvailable,
    lastLoginAt: this.lastLoginAt,
    lastSyncedAt: this.lastSyncedAt,
    lastDeepSyncedAt: this.lastDeepSyncedAt,
  };
};

const Character = mongoose.model('Character', characterSchema);

export default Character;
