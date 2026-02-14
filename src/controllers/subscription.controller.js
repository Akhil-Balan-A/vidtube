import { Subscription } from "#models";
import { ApiError, ApiResponse } from "#utils";
import mongoose from "mongoose";

//toggle to subscribe or unsubscribe (private)
export const toggleSubscription = async (req,res)=>{
    const {channelId} = req.params;
    const userId = req.user?.id;

    if(!mongoose.Types.ObjectId.isValid(channelId))
        throw new ApiError(400,"Invalid channel id","INVALID_CHANNEL_ID");

    // Prevent self subscription
    if(userId.toString() === channelId.toString())
        throw new ApiError(400,"Cannot subscribe to self","CANNOT_SUBSCRIBE_TO_SELF");

    // check if the user is already subscribed to the channel
    const existingSubscription = await Subscription.findOne({
      channel:channelId,
      subscriber:userId,
    });

    // if the user is alread subscribed to the channel, then unsubscribe
    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200,"Unsubscribed successfully",{}));
    }

    // else subscribe
    const subscription = await Subscription.create({channel:channelId,subscriber:userId});
    return res.status(200).json(new ApiResponse(200,"Subscribed successfully",subscription));
}

//get subscription count of any channel including me. no login required (works with public or private routes)
export const getChannelSubscriberCount = async (req,res)=>{
    const {channelId} = req.params;
    const userId = req.user?.id;

    if(!mongoose.Types.ObjectId.isValid(channelId))
        throw new ApiError(400,"Invalid channel id","INVALID_CHANNEL_ID");

    const subscriberCount = await Subscription.countDocuments({
        channel:channelId,
    });

    const isOwner = userId?channelId.toString()===userId.toString():false;

    return res.status(200).json(new ApiResponse(200,"Subscriber count fetched successfully",{
        channelId,
        subscriberCount,
        isOwner
    }));
}


//get all subscribers of my channel with  listed details (private-only owner)
export const getChannelSubscribers = async (req,res)=>{
    const userId = req.user.id;

    const subscriberDetails = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriberDetails"
            }
        },
        {
            $unwind:"$subscriberDetails"
        },
        {
            $project:{
                _id:0,
                subscriberId:"$subscriberDetails._id",
                username:"$subscriberDetails.username",
                avatar:"$subscriberDetails.avatar",
                fullName:"$subscriberDetails.fullName"
            }
        }
    ]) 

    return res.status(200).json(new ApiResponse(200,"Subscriber details fetched successfully",subscriberDetails));

}


//get all channels subscribed by me (private)
export const getSubscribedChannels = async (req,res)=>{
    const userId = req.user.id;

    const subscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelDetails"
            }
        },
        {
            $unwind:"$channelDetails"
        },
        {
            $project:{
                _id:0,
                channelId:"$channelDetails._id",
                username:"$channelDetails.username",
                avatar:"$channelDetails.avatar",
                fullName:"$channelDetails.fullName"
            }
        }
    ]) 

    return res.status(200).json(new ApiResponse(200,"Subscribed channels fetched successfully",subscribedChannels));
    
}

//When visiting a channel it shows am i subscribed to this channel or is this channel a subscriber of my channel.
export const checkSubscriptionStatus =async(req,res)=>{
  const { channelId } = req.params; //here we will get channel id which is of the user whose channel we are visiting. channel id is same as user id
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(channelId))
    throw new ApiError(400, "Invalid channel id", "INVALID_CHANNEL_ID");

  const isSubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });

  const isSubscriber = await Subscription.findOne({
    channel: userId,
    subscriber: channelId,
  });

  return res.status(200).json(
    new ApiResponse(200, "Subscription status fetched successfully", {
      isSubscribed: Boolean(isSubscribed),
      isSubscriber: Boolean(isSubscriber),
    })
  );
}

