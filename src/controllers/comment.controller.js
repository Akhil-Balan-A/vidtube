import { Comment,Video} from "#models"
import { logger,ApiResponse,ApiError } from "#utils"
import mongoose from "mongoose";


export const addComment = async(req,res)=>{
    const {videoId} = req.params;
    const {comment} = req.body; // comes from frontend where comment received from user through form.
    const userId = req.user.id; // only logged in user can add comment
 
    //Fetch video
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found","VIDEO_NOT_FOUND");
    }

    //Authorization check
    const isVideoOwner = video.owner.equals(userId);

    //Error throw only the compination where video is not published and user is not the owner
    //Error wont throw on below cases.
    /*
    1. video is published and user is not the owner
    2. video is not published and user is the owner
    3. video is published and user is the owner
    */ 
    if(!video.isPublished && !isVideoOwner){
        throw new ApiError(403,"You are not allowed to comment on this video","FORBIDDEN");
    }

    // create comment
    const newComment =  await Comment.create({
        video:videoId,
        content:comment,
        author:userId
    });

    await newComment.populate("author", "username fullName avatar");

    return res.status(201).json(new ApiResponse(201,"Comment added successfully",newComment));

}



export const updateComment = async(req,res)=>{
  const {commentId} = req.params;
  const {comment} = req.body;
  const userId = req.user.id;

  const existingComment = await Comment.findById(commentId);

  if(!existingComment){
    throw new ApiError(404,"Comment not found","COMMENT_NOT_FOUND");
  }

  // Check ownership
  if(existingComment.author.toString() !== userId){
    throw new ApiError(403,"You are not authorized to update this comment","UNAUTHORIZED");
  }

  existingComment.content = comment;
  await existingComment.save({validateBeforeSave:false});

  return res.status(200).json(new ApiResponse(200,"Comment updated successfully",existingComment));
}

export const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found", "COMMENT_NOT_FOUND");
  }

  const video = await Video.findById(comment.video);
  if (!video) {
    throw new ApiError(404, "Video not found", "VIDEO_NOT_FOUND");
  }

  const isCommentAuthor = comment.author.toString() === userId;

  const isVideoOwner = video.owner.toString() === userId;

  // Reject only if user is neither comment author nor video owner
  if (!isCommentAuthor && !isVideoOwner) {
    throw new ApiError(
      403,
      "You are not authorized to delete this comment",
      "UNAUTHORIZED"
    );
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully", {}));
};


export const getVideoComments = async(req,res)=>{
  const {videoId} = req.params;
  const {page = 1, limit = 10} = req.query;

  const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found", "VIDEO_NOT_FOUND");
    }

  const aggregateQuery = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId) // Filter by video ID
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [
            {
                $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        ]
      }
    },
    {
        $addFields: {
            author: { $first: "$author" }
        }
    },
    {
      $sort: { createdAt: -1 } // latest comment comes first
    }
  ]);

  // pagination options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const comments = await Comment.aggregatePaginate(aggregateQuery, options);

  return res.status(200).json(new ApiResponse(200,"Comments fetched successfully",comments));
}



