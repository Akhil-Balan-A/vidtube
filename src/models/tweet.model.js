import mongoose, { Schema } from "mongoose";
import { ApiError } from "#utils";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: false, // Can be null if image is present
      trim: true,
      minlength: 1,
      maxlength: 3000 // classic tweet style, can increase to 4000 if needed
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    image:{
      type:String,//Coudinary URL
    },
    imagePublicId:{
      type:String,//Cloudinary public ID for deletion
    },
    parentTweet:{
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      default:null,
      index:true
    },
    //soft delete
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

tweetSchema.pre("save", function(){
  if(!this.content && !this.image){
    throw new ApiError(400, "Tweet must have content or image", "INVALID_TWEET");
  }
})

export const Tweet = mongoose.model("Tweet", tweetSchema);
