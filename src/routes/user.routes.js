import { Router } from "express";
import { registerUser, loginUser } from "../controllers/user.controllers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { validate } from "../middlewares/validate.middleware.js";
import { userRegisterSchema } from "../validators/user.validators.js";

const userRouter = Router();

userRouter.route("/register").post(upload.fields([{
    name: "avatar",
    maxCount: 1
}, {
    name: "coverImage",
    maxCount: 1
}]), validate(userRegisterSchema), asyncHandler(registerUser));

userRouter.route("/login").post(asyncHandler(loginUser));

export default userRouter;
