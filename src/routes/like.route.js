import { Router } from "express";
import { validate } from "#middlewares";
import {
  toggleLikeSchema,
} from "#validators";

import {
    toggleLikeDislike,
    getLikedVideos
} from "#controllers";
import { verifyJWT } from "#middlewares";    
import { asyncHandler } from "#utils";

const router = Router();

// POST /api/v1/likes/toggle/:type/:id
router.route("/toggle/:type/:id").post(verifyJWT,validate(toggleLikeSchema),asyncHandler(toggleLikeDislike));

router.route("/liked-videos").get(verifyJWT,asyncHandler(getLikedVideos));



export default router;