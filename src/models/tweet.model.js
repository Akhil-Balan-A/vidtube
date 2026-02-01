import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 280 // classic tweet style, can increase to 4000 if needed
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    media: [
      {
        type: String // URLs to images/videos (cloudinary/S3)
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Useful indexing
tweetSchema.index({ author: 1 });

export const Tweet = mongoose.model("Tweet", tweetSchema);
