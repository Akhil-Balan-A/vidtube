import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { getCurrentUser, updateAccountInfo, changeCurrentPassword, updateAvatar, updateCoverImage,deleteAvatar,deleteCoverImage } from "../controllers/user.controllers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {validate} from "../middlewares/validate.middleware.js";
import { userChangePasswordSchema, userUpdateAccountInfoSchema } from "../validators/user.validators.js";


const userRouter = Router();

userRouter.route("/change-password").post(verifyJWT,validate(userChangePasswordSchema), asyncHandler(changeCurrentPassword));
userRouter.route("/me").get(verifyJWT, asyncHandler(getCurrentUser));
userRouter.route("/update-account-info").post(verifyJWT, validate(userUpdateAccountInfoSchema), asyncHandler(updateAccountInfo));
userRouter.route("/update-avatar").post(verifyJWT, upload.fields([{ name: "avatar", maxCount: 1 }]), asyncHandler(updateAvatar));
userRouter.route("/update-cover-image").post(verifyJWT, upload.fields([{ name: "coverImage", maxCount: 1 }]), asyncHandler(updateCoverImage));
userRouter.route("/delete-cover").delete(verifyJWT,asyncHandler(deleteCoverImage));
userRouter.route("/delete-avatar").delete(verifyJWT,asyncHandler(deleteAvatar));
export default userRouter;

