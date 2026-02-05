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
import { tweetSchema,tweetUpdateSchema } from "#validators";

const router = Router();

router.route("/").post(
    verifyJWT,
    upload.single("image"),
    validate(tweetSchema),
    asyncHandler(createTweet)
)
router.route("/:userId").get(
    asyncHandler(getUserTweets)
);

router.route("/:tweetId").put(
    verifyJWT,
    upload.single("image"),
    validate(tweetUpdateSchema),
    asyncHandler(updateTweet)
)

router.route("/:tweetId").delete(
    verifyJWT,
    asyncHandler(deleteTweet)
)



export default router;


