import { User } from "#models";
import { Subscription } from "#models";
import { WatchHistory } from "#models";
import { Video } from "#models";
import { ApiResponse, ApiError, logger, uploadOnCloudinary, deleteFromCloudinary } from "#utils";

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  // get user details
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", user));
};
const updateAccountInfo = async (req, res) => {
  // update user details like name,fullName,email
  const { username, fullName, email } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  // user may change any or all of the user info
  if (username) user.username = username;
  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  await user.save({ validateBeforeSave: false }); //will save only what is modified
  return res
    .status(200)
    .json(new ApiResponse(200, "Account info updated successfully", { user }));
};

const changeCurrentPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  const isPasswordMatched = await user.isPasswordMatched(currentPassword);
  if (!isPasswordMatched)
    throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false }); //will save only what is modified
  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully", {}));
};

const updateAvatar = async (req, res) => {
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let avatarUpload = null;
  let user = null;
  let oldAvatar = null;
  let oldAvatarPublicId = null;
  let newAvatarApplied = false;

  try {
    if (!avatarLocalPath)
      throw new ApiError(400, "Avatar is required", "AVATAR_REQUIRED");
    user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    // save old values for rollback
    oldAvatar = user.avatar;
    oldAvatarPublicId = user.avatarPublicId;

    //upload new avatar
    avatarUpload = await uploadOnCloudinary(avatarLocalPath, "vidtube/avatar");
    // Apply new values
    user.avatar = avatarUpload?.url;
    user.avatarPublicId = avatarUpload?.publicId;
    newAvatarApplied = true;

    //delete old avatar
    if (oldAvatarPublicId) {
      await deleteFromCloudinary(oldAvatarPublicId);
    }

    await user.save({ validateBeforeSave: false }); //will save only what is modified
    return res
      .status(200)
      .json(new ApiResponse(200, "Avatar updated successfully", { user }));
  } catch (error) {
    logger.error("❌ Error updating avatar:", error.message);
    // 1. Delete uploaded Cloudinary avatar if upload succeeded
    try {
      if (avatarUpload?.publicId) {
        await deleteFromCloudinary(avatarUpload.publicId);
      }
    } catch (cleanupErr) {
      logger.error("❌ Cloudinary delete failed:", cleanupErr.message);
    }

    // 2. Rollback DB if avatar was updated before failure
    try {
      if (user && newAvatarApplied) {
        user.avatar = oldAvatar;
        user.avatarPublicId = oldAvatarPublicId;
        await user.save({ validateBeforeSave: false });
      }
    } catch (rollbackErr) {
      logger.error("❌ Failed to rollback user data:", rollbackErr.message);
    }
    throw new ApiError(
      500,
      "Error updating avatar",
      "UPDATE_AVATAR_ERROR",
      error
    );
  }
};

const updateCoverImage = async (req, res) => {
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  let coverUpload = null;
  let user = null;
  let oldCoverImage = null;
  let oldCoverImagePublicId = null;
  let newImageApplied = false;
  try {
    if (!coverImageLocalPath)
      throw new ApiError(
        400,
        "Cover image is required",
        "COVER_IMAGE_REQUIRED"
      );
    user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    // save old values for rollback
    oldCoverImage = user.coverImage;
    oldCoverImagePublicId = user.coverImagePublicId;

    //upload new cover image
    coverUpload = await uploadOnCloudinary(
      coverImageLocalPath,
      "vidtube/coverImage"
    );
    // save new values
    user.coverImage = coverUpload?.url;
    user.coverImagePublicId = coverUpload?.publicId;
    newImageApplied = true;

    await user.save({ validateBeforeSave: false }); //will save only what is modified
    //delete old cover image
    if (oldCoverImagePublicId) {
      await deleteFromCloudinary(oldCoverImagePublicId);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Cover image updated successfully", { user }));
  } catch (error) {
    // console.log("❌ Error in updateCoverImage:", error.message)
    logger.error("❌ Error in updateCoverImage:", error.message);

    // Cleanup block (delete cloud + local)
    try {
      if (coverUpload?.publicId) {
        await deleteFromCloudinary(coverUpload.publicId);
      }
    } catch (cleanupErr) {
      logger.error("❌ Cloudinary delete failed:", cleanupErr.message);
    }
    // Rollack user DB values if user was loaded with image details before error
    try {
      if (user && newImageApplied) {
        user.coverImage = oldCoverImage;
        user.coverImagePublicId = oldCoverImagePublicId;
        await user.save({ validateBeforeSave: false });
      }
    } catch (rollbackErr) {
      logger.error("❌ Failed to rollback user data:", rollbackErr.message);
    }
    throw new ApiError(
      500,
      "Failed to update cover image",
      "UPDATE_COVER_IMAGE_ERROR",
      error
    );
  }
};

const deleteAvatar = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");

  if (!user.avatarPublicId) {
    throw new ApiError(400, "No avatar image to delete", "NO_AVATAR_FOUND");
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(user.avatarPublicId);

  // Clear DB fields
  user.avatar = null;
  user.avatarPublicId = null;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar image deleted successfully"));
};

const deleteCoverImage = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");

  if (!user.coverImagePublicId) {
    throw new ApiError(400, "No cover image to delete", "NO_COVER_FOUND");
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(user.coverImagePublicId);

  // Clear DB fields
  user.coverImage = null;
  user.coverImagePublicId = null;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Cover image deleted successfully"));
};

const getUserChannelProfile = async (req, res) => {
  const { id } = req.params;

  const channelUser = await User.findById(id);
  if (!channelUser) {
    throw new ApiError(404, "Channel not found", "CHANNEL_NOT_FOUND");
  }

  /*
  const channelProfile = await User.aggregate([
  // Match the channel user
  { $match: { _id: new mongoose.Types.ObjectId(id) } },
  
  // Lookup subscribers (users who subscribed to this channel)
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers"
    }
  },
  
  // Lookup subscribed channels (channels this user subscribed to)
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedChannels"
    }
  },
  
  // Lookup videos
  {
    $lookup: {
      from: "videos",
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$owner", "$$userId"] },
                { $eq: ["$isPublished", true] }
              ]
            }
          }
        }
      ],
      as: "videos"
    }
  },
  
  // Add computed fields
  {
    $addFields: {
      subscriberCount: { $size: "$subscribers" },
      subscribedToCount: { $size: "$subscribedChannels" },
      videoCount: { $size: "$videos" }
    }
  },
  
  // Project only needed fields
  {
    $project: {
      username: 1,
      fullName: 1,
      email: 1,
      avatar: 1,
      coverImage: 1,
      isEmailVerified: 1,
      createdAt: 1,
      updatedAt: 1,
      subscriberCount: 1,
      subscribedToCount: 1,
      videoCount: 1
    }
  }
]);
  
  */

  // channel i subcribed.
  const subscriberCount = await Subscription.countDocuments({ channel: id });

  // channels that subcribe to this channel.
  const subscribedToCount = await Subscription.countDocuments({
    subscriber: id,
  });

  // videos of this channel.
  const videoCount = await Video.countDocuments({
    owner: id,
    isPublished: true,
  });

  // Check if current user is subscribed to this channel
  let isSubscribed = false;
  if (req.user && req.user.id !== id) {
    const subscription = await Subscription.findOne({
      subscriber: req.user.id,
      channel: id,
    });
    isSubscribed = !!subscription;
  }

  // Prepare channel profile data
  const channelProfile = {
    _id: channelUser._id,
    username: channelUser.username,
    fullName: channelUser.fullName,
    email: channelUser.email,
    avatar: channelUser.avatar,
    coverImage: channelUser.coverImage,
    isEmailVerified: channelUser.isEmailVerified,
    createdAt: channelUser.createdAt,
    updatedAt: channelUser.updatedAt,
    subscriberCount,
    subscribedToCount,
    videoCount,
    isSubscribed,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Channel profile fetched successfully",
        channelProfile
      )
    );
};


export {
  getCurrentUser,
  updateAccountInfo,
  changeCurrentPassword,
  updateAvatar,
  updateCoverImage,
  deleteAvatar,
  deleteCoverImage,
  getUserChannelProfile,
  
};
