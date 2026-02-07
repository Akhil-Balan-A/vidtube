import express from "express";
import { addToWatchHistory, clearWatchHistory, getWatchHistory, removeFromWatchHistory } from "#controllers";
import { asyncHandler } from "#utils";
import { validate } from "#middlewares";
import { verifyJWT } from "#middlewares";
import { watchHistoryValidator } from "#validators";

const router = express.Router();


router.post("/", verifyJWT, validate(watchHistoryValidator), asyncHandler(addToWatchHistory));
router.get("/", verifyJWT, validate(watchHistoryValidator), asyncHandler(getWatchHistory));
router.delete("/", verifyJWT, validate(watchHistoryValidator), asyncHandler(removeFromWatchHistory));
router.delete("/clear", verifyJWT, validate(watchHistoryValidator), asyncHandler(clearWatchHistory));


export default router;
