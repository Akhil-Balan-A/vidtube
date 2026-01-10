import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,  // YouTube-like
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Polymorphic target
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },

    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet"
    },

    // Reply system
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },

    isDeleted: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);

// Only one target allowed (video OR tweet OR parentComment)
commentSchema.pre("save", function (next) {
  const targets = [this.video, this.tweet, this.parentComment].filter(Boolean);
  if (targets.length !== 1) {
    return next(
      new Error("Comment must belong to exactly one target (video/tweet/comment).")
    );
  }
  next();
});

// Useful index for performance
commentSchema.index({ video: 1 });
commentSchema.index({ tweet: 1 });
commentSchema.index({ parentComment: 1 });

export const Comment = mongoose.model("Comment", commentSchema);
