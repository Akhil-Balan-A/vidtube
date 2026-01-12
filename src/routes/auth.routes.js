import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/auth.controllers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { validate } from "../middlewares/validate.middleware.js";
import { userLoginSchema, userRegisterSchema } from "../validators/auth.validators.js";
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

export default authRouter;
