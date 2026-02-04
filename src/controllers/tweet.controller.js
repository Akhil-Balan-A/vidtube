import {
  ApiResponse,
  ApiError,
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "#utils";
import fs from "fs";
import { Tweet } from "#models";
import { logger } from "#utils";

export const createTweet = async (req, res) => {
  const userId = req.user.id;
  const { content, parentTweet } = req.body; // content is already trimmed by validator and here parentweet will give id of parent tweet

  //file from multer
  const imageLocalPath = req.file?.path || null;

  // validate parent tweet if this is a reply
  if (parentTweet) {
    const parent = await Tweet.findById(parentTweet);
    if (!parent || parent.isDeleted) {
      throw new ApiError(400, "Invalid parent tweet", "INVALID_PARENT_TWEET");
    }
  }

  // validate content
  // rule A: root tweet will have content or image 
  // rulte B: reply tweet will have only content no images allwoed
  // here content can see by zod but still we need to check this since file is not validated by zod.
if(parentTweet){
    if(!content){
        throw new ApiError(400, "Reply tweet must have content", "INVALID_TWEET");
    }
    if(imageLocalPath){
        throw new ApiError(400, "Reply tweet must not have image", "INVALID_TWEET");
    }
}
else{
    if(!content && !imageLocalPath){
        throw new ApiError(400, "Tweet must have either content or image", "INVALID_TWEET");
    }
}

  let imageUpload = null;

  try {
    if (imageLocalPath) {
      imageUpload = await uploadOnCloudinary(imageLocalPath, "vidtube/tweets");
    }

    const tweet = await Tweet.create({
      content: content??null,
      image: imageUpload?.url || null,
      imagePublicId: imageUpload?.publicId || null,
      author: userId,
      parentTweet: parentTweet || null,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Tweet created successfully", tweet));
  } catch (error) {
    if (imageUpload?.publicId) {
      await deleteFromCloudinary(imageUpload.publicId);
    }
    throw error; // preserve original error
  } finally {
    if (imageLocalPath && fs.existsSync(imageLocalPath)) {
      fs.unlinkSync(imageLocalPath);
    }
  }
};

export const getUserTweets = async (req, res) => {};

export const updateTweet = async (req, res) => {};

export const deleteTweet = async (req, res) => {};
