import { Router } from "express";
// import {
//   addComment,
//   deleteComment,
//   getVideoComments,
//   updateComment,
// } from "../controllers/comment.controller.js";
import {addComment,updateComment} from "#controllers"
import { verifyJWT, optionalVerifyJWT } from "#middlewares";    
import { asyncHandler } from "#utils";
import { validate } from "#middlewares";
import { commentSchema, updateCommentSchema } from "#validators";

const commentRouter = Router();

//Route for video comments
commentRouter.route("/add/:videoId").post(verifyJWT,validate(commentSchema),asyncHandler(addComment));

commentRouter.route("/update/:commentId").patch(verifyJWT,validate(updateCommentSchema),asyncHandler(updateComment));

// // Routes for video comments
// // GET /api/v1/comments/:videoId - Get all comments for a video (Public/Optional Auth for user-specific data like 'isLiked' in future)
// router.route("/:videoId").get(optionalVerifyJWT, getVideoComments);

// // POST /api/v1/comments/:videoId - Add a comment to a video (Auth required)
// router.route("/:videoId").post(verifyJWT, addComment);

// // Routes for individual comments
// // DELETE /api/v1/comments/c/:commentId - Delete a comment (Auth required)
// router.route("/c/:commentId").delete(verifyJWT, deleteComment);

// // PATCH /api/v1/comments/c/:commentId - Update a comment (Auth required)
// router.route("/c/:commentId").patch(verifyJWT, updateComment);

export default commentRouter;
