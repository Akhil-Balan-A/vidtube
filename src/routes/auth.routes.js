import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, verifyEmail,resendVerificationEmail,forgotPasswordRequest,resetPassword } from "../controllers/auth.controllers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { validate } from "../middlewares/validate.middleware.js";
import { userLoginSchema, userRegisterSchema,userResetPasswordSchema } from "../validators/auth.validators.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const authRouter = Router();

authRouter.route("/register").post(upload.fields([{
    name: "avatar",
    maxCount: 1
}, {
    name: "coverImage",
    maxCount: 1
}]), validate(userRegisterSchema), asyncHandler(registerUser));

authRouter.route("/login").post(validate(userLoginSchema),asyncHandler(loginUser));

authRouter.route("/refresh-token").post(asyncHandler(refreshAccessToken));

authRouter.route("/logout").get(verifyJWT,asyncHandler(logoutUser));

authRouter.route("/verify-email/:code").get(asyncHandler(verifyEmail));

//when user not verify email throw welcome email below route is used 
authRouter.route("/resend-verification-email").get(asyncHandler(resendVerificationEmail));

authRouter.route("/forgot-password").get(asyncHandler(forgotPasswordRequest));

authRouter.route("/reset-password/:token").post(validate(userResetPasswordSchema),asyncHandler(resetPassword));

export default authRouter;
