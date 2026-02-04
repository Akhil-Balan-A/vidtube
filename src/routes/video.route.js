import { asyncHandler } from "#utils";
import { upload } from "#middlewares";
import { verifyJWT, optionalVerifyJWT } from "#middlewares";
import {
  uploadVideo,
  getAllVideos,
  viewVideo,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";
import { validate } from "#middlewares";
import {
  videoUploadSchema,
  videoUpdateSchema,
} from "#validators";
import { Router } from "express";

const router = Router();

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  validate(videoUploadSchema),
  asyncHandler(uploadVideo)
);

router.route("/").get(asyncHandler(getAllVideos));
router.route("/:id").get(optionalVerifyJWT, asyncHandler(viewVideo));
router
  .route("/update/:id")
  .patch(
    verifyJWT,
    upload.single("thumbnail"),
    validate(videoUpdateSchema),
    asyncHandler(updateVideo)
  );

router.route("/delete/:id").delete(verifyJWT, asyncHandler(deleteVideo));
router
  .route("/toggle-publish/:id")
  .patch(verifyJWT, asyncHandler(togglePublishStatus));

export default router;
