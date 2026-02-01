import { Router } from "express";
import { upload } from "#middlewares";
import {
  getCurrentUser,
  updateAccountInfo,
  changeCurrentPassword,
  updateAvatar,
  updateCoverImage,
  deleteAvatar,
  deleteCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { asyncHandler } from "#utils";
import { verifyJWT } from "#middlewares";
import { validate } from "#middlewares";
import {
  userChangePasswordSchema,
  userUpdateAccountInfoSchema,
} from "#validators";

const userRouter = Router();

userRouter
  .route("/change-password")
  .patch(
    verifyJWT,
    validate(userChangePasswordSchema),
    asyncHandler(changeCurrentPassword)
  );
userRouter.route("/me").get(verifyJWT, asyncHandler(getCurrentUser));
userRouter
  .route("/update-account-info")
  .patch(
    verifyJWT,
    validate(userUpdateAccountInfoSchema),
    asyncHandler(updateAccountInfo)
  );
userRouter
  .route("/update-avatar")
  .patch(
    verifyJWT,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    asyncHandler(updateAvatar)
  );
userRouter
  .route("/update-cover-image")
  .patch(
    verifyJWT,
    upload.fields([{ name: "coverImage", maxCount: 1 }]),
    asyncHandler(updateCoverImage)
  );
userRouter
  .route("/delete-cover")
  .delete(verifyJWT, asyncHandler(deleteCoverImage));
userRouter
  .route("/delete-avatar")
  .delete(verifyJWT, asyncHandler(deleteAvatar));
userRouter.route("/channel/:id").get(asyncHandler(getUserChannelProfile));
userRouter
  .route("/watch-history")
  .get(verifyJWT, asyncHandler(getWatchHistory));
export default userRouter;
