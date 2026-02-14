import express from "express";
import { validate } from "#middlewares";
import { playlistSchema } from "#validators";
import {verifyJWT,optionalVerifyJWT} from "#middlewares";
import { asyncHandler } from "#utils";
import {
  createPlaylist,
  getUserPlaylists,
  addVideoToPlaylist,
  updatePlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
} from "#controllers";

const Router = express.Router();

Router.route("/").post(verifyJWT,validate(playlistSchema),asyncHandler(createPlaylist));
Router.route("/:userId").get(optionalVerifyJWT,asyncHandler(getUserPlaylists));
Router.route("/:playlistId/:videoId").post(verifyJWT,asyncHandler(addVideoToPlaylist));
Router.route("/:playlistId").patch(verifyJWT,validate(playlistSchema),asyncHandler(updatePlaylist));
Router.route("/:playlistId/:videoId").delete(verifyJWT,asyncHandler(removeVideoFromPlaylist));
Router.route("/:playlistId").delete(verifyJWT,asyncHandler(deletePlaylist));


export default Router;

