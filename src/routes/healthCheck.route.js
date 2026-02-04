import { Router } from "express";
import { healthCheck } from "#controllers";
import { asyncHandler } from "#utils";

const router = Router();

router.route("/").get(asyncHandler(healthCheck));

export default router;
