import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const likeSchema = new Schema(
  {
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // polymorphic target: only one should be filled
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet"
    }
  },
  {
    timestamps: true
  }
);

likeSchema.plugin(mongooseAggregatePaginate);

// Ensure exactly ONE target is selected
likeSchema.pre("save", function (next) {
  const targets = [this.video, this.comment, this.tweet].filter(Boolean);

  if (targets.length !== 1) {
    return next(
      new Error("Like must belong to exactly one target (video/comment/tweet).")
    );
  }

  next();
});

// Prevent double-like on same target
likeSchema.index({ likedBy: 1, video: 1 }, { unique: true, sparse: true });
likeSchema.index({ likedBy: 1, comment: 1 }, { unique: true, sparse: true });
likeSchema.index({ likedBy: 1, tweet: 1 }, { unique: true, sparse: true });

export const Like = mongoose.model("Like", likeSchema);
