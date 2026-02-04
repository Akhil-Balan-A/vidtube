import { Router } from "express";
import { upload } from "#middlewares";  
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "#controllers";
import { verifyJWT } from "#middlewares";
import { asyncHandler } from "#utils";
import { validate } from "#middlewares";
import { tweetSchema } from "#validators";

const router = Router();

router.route("/").post(
    verifyJWT,
    upload.single("image"),
    validate(tweetSchema),
    asyncHandler(createTweet)
)



export default router;


