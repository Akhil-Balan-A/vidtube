import express from "express";
import { addToWatchHistory, getWatchHistory, removeFromWatchHistory, clearWatchHistory } from "#controllers";
import { asyncHandler } from "#utils";
import { verifyJWT } from "#middlewares";

const router = express.Router();

router.use(verifyJWT);

// Specific routes first
router.route("/clear").delete(verifyJWT, asyncHandler(clearWatchHistory));
router.route("/").get(verifyJWT, asyncHandler(getWatchHistory));

// Parameterized routes last
router.route("/:videoId")
    .post(verifyJWT, asyncHandler(addToWatchHistory))
    .delete(verifyJWT, asyncHandler(removeFromWatchHistory));

export default router;
