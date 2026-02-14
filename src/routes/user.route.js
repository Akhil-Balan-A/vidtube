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
  
} from "../controllers/user.controller.js";
import { asyncHandler } from "#utils";
import { verifyJWT } from "#middlewares";
import { validate } from "#middlewares";
import {
  userChangePasswordSchema,
  userUpdateAccountInfoSchema,
} from "#validators";

const router = Router();

router
  .route("/change-password")
  .patch(
    verifyJWT,
    validate(userChangePasswordSchema),
    asyncHandler(changeCurrentPassword)
  );
router.route("/me").get(verifyJWT, asyncHandler(getCurrentUser));
router
  .route("/update-account-info")
  .patch(
    verifyJWT,
    validate(userUpdateAccountInfoSchema),
    asyncHandler(updateAccountInfo)
  );
router
  .route("/update-avatar")
  .patch(
    verifyJWT,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    asyncHandler(updateAvatar)
  );
router
  .route("/update-cover-image")
  .patch(
    verifyJWT,
    upload.fields([{ name: "coverImage", maxCount: 1 }]),
    asyncHandler(updateCoverImage)
  );
router
  .route("/delete-cover")
  .delete(verifyJWT, asyncHandler(deleteCoverImage));
router
  .route("/delete-avatar")
  .delete(verifyJWT, asyncHandler(deleteAvatar));
router.route("/channel/:id").get(asyncHandler(getUserChannelProfile));

export default router;
