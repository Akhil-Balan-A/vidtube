import { Router } from "express";

import {
  addComment,
  updateComment,
  deleteComment,
  getVideoComments,
} from "#controllers";
import { verifyJWT } from "#middlewares";    
import { asyncHandler } from "#utils";
import { validate } from "#middlewares";
import { commentSchema, updateCommentSchema } from "#validators";

const router = Router();

//Route for video comments
router.route("/:videoId").post(verifyJWT,validate(commentSchema),asyncHandler(addComment));

router.route("/:commentId").patch(verifyJWT,validate(updateCommentSchema),asyncHandler(updateComment));

router.route("/:commentId").delete(verifyJWT,asyncHandler(deleteComment));

router.route("/:videoId").get(asyncHandler(getVideoComments)); // video commment can be seen by anyone


export default router;
