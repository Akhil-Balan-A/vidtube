import { Router } from "express";
import { healthCheck } from "#controllers";
import { asyncHandler } from "#utils";

const healthCheckRouter = Router();

healthCheckRouter.route("/").get(asyncHandler(healthCheck));

export default healthCheckRouter;
