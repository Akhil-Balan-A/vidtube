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

const videoRouter = Router();

videoRouter.route("/upload").post(
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

videoRouter.route("/").get(asyncHandler(getAllVideos));
videoRouter.route("/:id").get(optionalVerifyJWT, asyncHandler(viewVideo));
videoRouter
  .route("/update/:id")
  .patch(
    verifyJWT,
    upload.single("thumbnail"),
    validate(videoUpdateSchema),
    asyncHandler(updateVideo)
  );

videoRouter.route("/delete/:id").delete(verifyJWT, asyncHandler(deleteVideo));
videoRouter
  .route("/toggle-publish/:id")
  .patch(verifyJWT, asyncHandler(togglePublishStatus));

export default videoRouter;
