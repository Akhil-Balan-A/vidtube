import { Router } from "express";
import {getCurrentUser, updateAccountInfo, changeCurrentPassword, updateAvatar, updateCoverImage} from "../controllers/user.controllers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {validate} from "../middlewares/validate.middleware.js";
import { userChangePasswordSchema,userUpdateAccountInfoSchema} from "../validators/user.validators.js";

const userRouter = Router();

userRouter.route("/change-password").post(verifyJWT,validate(userChangePasswordSchema), asyncHandler(changeCurrentPassword));
userRouter.route("/me").get(verifyJWT, asyncHandler(getCurrentUser));
userRouter.route("/update-account-info").post(verifyJWT,validate(userUpdateAccountInfoSchema), asyncHandler(updateAccountInfo));
export default userRouter;

