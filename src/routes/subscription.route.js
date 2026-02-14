import express from "express";
import {verifyJWT,optionalVerifyJWT} from "#middlewares";
import { asyncHandler } from "#utils";
import {
  toggleSubscription,
  getChannelSubscriberCount,
  getChannelSubscribers,
  getSubscribedChannels,
  checkSubscriptionStatus
} from "#controllers";

const Router = express.Router();

Router.route('/:channelId').post(verifyJWT,asyncHandler(toggleSubscription));
Router.route('/:channelId').get(optionalVerifyJWT,asyncHandler(getChannelSubscriberCount));
Router.route('/channel/my-subscribers').get(verifyJWT,asyncHandler(getChannelSubscribers));// details of our channels subscribers
Router.route('/channel/my-subscriptions').get(verifyJWT,asyncHandler(getSubscribedChannels))// details of channels subscribed by me
Router.route('/status/:channelId').get(optionalVerifyJWT,asyncHandler(checkSubscriptionStatus));


export default Router;