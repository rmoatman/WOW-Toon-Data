import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned unless explicitly requested
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    // Read-only seeded demo account: blocks mutations like delete/reset.
    isDemo: {
      type: Boolean,
      default: false,
    },
    // Password reset: we store only the SHA-256 hash of the emailed token.
    resetTokenHash: { type: String, select: false, default: null },
    resetTokenExpires: { type: Date, select: false, default: null },

    // ---- Battle.net linkage (populated in M3) ----
    battletag: { type: String, default: null },
    blizzardRegion: { type: String, default: 'us' },
    blizzardUserId: { type: String, default: null },
    // Blizzard issues no refresh token; the user access token lasts ~24h. We
    // store it encrypted so roster re-syncs work until it expires, then the
    // user reconnects. Never returned to the client.
    blizzardAccessToken: { type: String, select: false, default: null },
    blizzardTokenExpires: { type: Date, select: false, default: null },
  },
  { timestamps: true }
);

// Shape the object sent to clients: drop internal fields.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    displayName: this.displayName,
    isDemo: this.isDemo,
    battletag: this.battletag,
    blizzardRegion: this.blizzardRegion,
    battlenetLinked: Boolean(this.battletag),
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
