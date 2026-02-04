import { Like } from "#models";
import { ApiResponse, ApiError } from "#utils";

export const toggleLikeDislike = async (req, res) => {
  const userId = req.user.id; //id from jwt
  const { action } = req.body; //like or dislike from user
  let { type, id } = req.params; //target type (video or comment or tweet) and its id

  // Normalize type (e.g., "video" -> "Video") to match Enum
  type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();//makes first one uppercase and slice makes rest of it lowercase

  const validTypes = ["Video", "Comment", "Tweet"];

  if(!validTypes.includes(type)){
      throw new ApiError(400, "Invalid target type", "INVALID_TARGET_TYPE");
  }

  const existing = await Like.findOne({
    user: userId,
    targetType: type,
    targetId: id,
  });

  if (!existing) {
    const newLike = await Like.create({
      user: userId,
      targetType: type,
      targetId: id,
      action,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, `${action} added successfully`, newLike));
  }

  // Same action Toggle Off

  if (existing.action === action) {
    await Like.deleteOne({ _id: existing._id });

    return res
      .status(200)
      .json(new ApiResponse(200, `${action} removed successfully`, {}));
  }

  // switch action means like video directly disliked or disliked vide directly liked

  existing.action = action;
  await existing.save();

  return res
    .status(200)
    .json(new ApiResponse(200, `changed to ${action}`, existing));
};

export const getLikedVideos = async(req,res)=>{
    const userId = req.user.id;
    const likedVideos = await Like.find({
        user: userId,
        targetType: "Video",
        action: "like",
    }).populate("targetId");
    return res
        .status(200)
        .json(new ApiResponse(200, "Liked videos fetched successfully", likedVideos));
}
