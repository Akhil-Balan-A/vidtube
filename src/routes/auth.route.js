import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, verifyEmail,resendVerificationEmail,forgotPasswordRequest,resetPassword } from "#controllers";
import { asyncHandler } from "#utils";
import { upload } from "#middlewares";
import { validate } from "#middlewares";
import { userLoginSchema, userRegisterSchema,userResetPasswordSchema } from "#validators";
import { verifyJWT } from "#middlewares";

const authRouter = Router();

authRouter.route("/register").post(upload.fields([{
    name: "avatar",
    maxCount: 1
}, {
    name: "coverImage",
    maxCount: 1
}]), validate(userRegisterSchema), asyncHandler(registerUser));

// handles login request
authRouter.route("/login").post(validate(userLoginSchema),asyncHandler(loginUser));

// handles refresh token request
authRouter.route("/refresh-token").post(asyncHandler(refreshAccessToken));

// handles logout request
authRouter.route("/logout").post(verifyJWT,asyncHandler(logoutUser));

// handles verify email request
authRouter.route("/verify-email/:code").post(asyncHandler(verifyEmail));

//when user not verify on weclome email, use can manual resend email verify link
authRouter.route("/resend-verification-email").post(asyncHandler(resendVerificationEmail));

// handles forgot password request using email id of user
authRouter.route("/forgot-password").post(asyncHandler(forgotPasswordRequest));

// handles reset password request using token sent to user email id
authRouter.route("/reset-password/:token").post(validate(userResetPasswordSchema),asyncHandler(resetPassword));

export default authRouter;
