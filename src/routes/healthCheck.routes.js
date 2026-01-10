import { Router } from "express";
import { healthCheck } from "../controllers/healthCheck.controllers.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheckRouter = Router();

healthCheckRouter.route("/").get( asyncHandler(healthCheck) );

export default healthCheckRouter;
