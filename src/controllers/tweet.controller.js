import {
  ApiResponse,
  ApiError,
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "#utils";
import fs from "fs";
import { Tweet } from "#models";

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
  if (parentTweet) {
    if (!content) {
      throw new ApiError(400, "Reply tweet must have content", "INVALID_TWEET");
    }
    if (imageLocalPath) {
      throw new ApiError(
        400,
        "Reply tweet must not have image",
        "INVALID_TWEET"
      );
    }
  } else {
    if (!content && !imageLocalPath) {
      throw new ApiError(
        400,
        "Tweet must have either content or image",
        "INVALID_TWEET"
      );
    }
  }

  let imageUpload = null;

  try {
    if (imageLocalPath) {
      imageUpload = await uploadOnCloudinary(imageLocalPath, "vidtube/tweets");
    }

    const tweet = await Tweet.create({
      content: content ?? null,
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

// get tweets of a particular user (include main tweets and replies) unprotected route
export const getUserTweets = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query; // in url we put like ?page=2&limit=5 if needed,else it will take default values.

  const tweets = await Tweet.find({ author: userId, isDeleted: false })
    .populate("author", "username")
    .populate("parentTweet", "content author")
    .sort({ createdAt: -1 })
    .limit(limit * 1)// limit is multiplied by 1 just to make it number as query values are strings.
    .skip((page - 1) * limit);// skip is used for pagination. where user want to skip pages.. e.g: if user want to  view the 3rd page then it will skp the first 2 pages where 20 tweets are there.
    // skip((3-1)*10) = 20

  const totalTweets = await Tweet.countDocuments({
    author: userId,
    isDeleted: false,
  });
  const totalPages = Math.ceil(totalTweets / limit);// if 21 tweets are there and limit is 10 then ceil will make 2.1 to 3 pages.e.g: 21/10 = 2.1 -> 3
  const hasMore = page < totalPages;// if page is 1 and totalPages is 3 then hasMore will be true.
  const nextPage = page + 1 > totalPages ? null : page + 1;// if page is 1 and totalPages is 3 then nextPage will be 2.
  const prevPage = page - 1 < 1 ? null : page - 1;// if page is 1 and totalPages is 3 then prevPage will be null.
  const data = {
    tweets,
    totalTweets,
    totalPages,
    hasMore,
    nextPage,
    prevPage,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweets fetched successfully", data));
};

//update tweet or reply (for main tweet content and image can be changed by owner but for reply only content can be changed by owner)
export const updateTweet = async (req, res) => {
  const userId = req.user.id;
  const { content } = req.body;
  const { tweetId } = req.params;
  const imageLocalPath = req.file?.path || null;

  const tweet = await Tweet.findById(tweetId);
  if (!tweet || tweet.isDeleted) {
    throw new ApiError(404, "Tweet not found", "TWEET_NOT_FOUND");
  }

  // Authorization check
  if (tweet.author.toString() !== userId) {
    throw new ApiError(
      403,
      "You are not authorized to update this tweet",
      "UNAUTHORIZED"
    );
  }

  let imageUpload = null;
  const oldImagePublicId = tweet.imagePublicId;

  try {
    // For replies, only content can be updated
    if (tweet.parentTweet && imageLocalPath) {
      throw new ApiError(
        400,
        "Cannot update image for replies",
        "INVALID_UPDATE"
      );
    }

    // Upload new image if provided
    if (imageLocalPath) {
      imageUpload = await uploadOnCloudinary(imageLocalPath, "vidtube/tweets");
      tweet.image = imageUpload.url;
      tweet.imagePublicId = imageUpload.publicId;
    }

    // Update content if provided
    if (content !== undefined) {
      tweet.content = content || null;
    }

    // Ensure at least content or image exists
    if (!tweet.content && !tweet.image) {
      throw new ApiError(
        400,
        "Tweet must have either content or image",
        "INVALID_TWEET"
      );
    }

    await tweet.save();

    // Delete old image if new one was uploaded
    if (imageUpload && oldImagePublicId) {
      await deleteFromCloudinary(oldImagePublicId);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Tweet updated successfully", tweet));
  } catch (error) {
    // Rollback: delete newly uploaded image if update failed
    if (imageUpload?.publicId) {
      await deleteFromCloudinary(imageUpload.publicId);
    }
    throw error;
  } finally {
    if (imageLocalPath && fs.existsSync(imageLocalPath)) {
      fs.unlinkSync(imageLocalPath);
    }
  }
};

// soft delete tweet (only author can delete the tweet or reply).If any other user put bad replay on the users tweet then the user can delete that replay.

export const deleteTweet = async (req, res) => {
  const userId = req.user.id;
  const { tweetId } = req.params;

  const tweet = await Tweet.findById(tweetId);
  if (!tweet || tweet.isDeleted) {
    throw new ApiError(404, "Tweet not found", "TWEET_NOT_FOUND");
  }

  // Authorization: Owner can delete their tweet, or tweet owner can delete replies on their tweet if find it uncomfortable

  // Case 1: Author deleting own tweet or reply tweet
  if (tweet.author.toString() === userId) {
    tweet.isDeleted = true;
    await tweet.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Tweet deleted successfully", {}));
  }

  // Case 2: Author deleting a reply on their tweet by others
  if (tweet.parentTweet) {
    const parent = await Tweet.findById(tweet.parentTweet);

    if (parent && parent.author.toString() === userId) {
      tweet.isDeleted = true;
      await tweet.save();

      return res
        .status(200)
        .json(new ApiResponse(200, "Reply deleted successfully", {}));
    }
  }

  // If neither case matches, user is not authorized
  throw new ApiError(
    403,
    "You are not authorized to delete this tweet",
    "UNAUTHORIZED"
  );
};
