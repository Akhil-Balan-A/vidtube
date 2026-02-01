import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },
    watchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    watchDuration: {
      // How long the user watched (in seconds)
      type: Number,
      default: 0,
    },
    watchProgress: {
      // Percentage of video watched (0-100)
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      // Whether the user completed watching the video
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries (get user's watch history sorted by time)
watchHistorySchema.index({ user: 1, watchedAt: -1 });

// Prevent duplicate entries for same user-video combination
// Also makes queries like "has user watched this video?" very fast
watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
