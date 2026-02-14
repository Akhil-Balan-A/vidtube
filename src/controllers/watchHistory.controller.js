import { ApiResponse, ApiError } from "#utils";
import { WatchHistory,Video } from "#models";
import mongoose from "mongoose";


export const addToWatchHistory = async (req, res) => {
    const userId = req.user.id;
    const {videoId} = req.params;

    //Validate video ID
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id", "INVALID_VIDEO_ID");
    }

    //Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found", "VIDEO_NOT_FOUND");
    }

    //Check if user has already watched this video, if watched update the watchedAt time
    const watchHistory = await WatchHistory.findOneAndUpdate(
        {
            user: userId,
            video: videoId
        },// update matching criteria
        {
            $set: {
                watchedAt: Date.now()
            }
        },
        {
            new: true,//new true returns updated document
            upsert: true, // Create a new document if no documents match the filter
            setDefaultsOnInsert: true//set default values if document is created                    
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Watch history updated",
                watchHistory
            )
        );
};


export const getWatchHistory = async (req, res) => {
    const userId = req.user.id;
    //pagination inputs
    const { page = "1", limit = "10" } = req.query;

    //convert to numbers as query parameters are string in default. and this version of it will prevent negative page numbers and non-numeric values.
    const pageNumber = Math.max(1, parseInt(page,10) || 1);
    const limitNumber = Math.min(50, Math.max(parseInt(limit, 10) || 10));

    const watchHistory = await WatchHistory.find({ user: userId })
        .populate({
            path: "video",
            select: "title thumbnail owner views createdAt duration", // Added useful fields
            model: "Video",
            populate: {
                path: "owner", // populate owner of the video
                select: "username avatar",
                model: "User"
            }
        })
        .sort({ watchedAt: -1 }) //most recent first
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber);

    const totalVideos = await WatchHistory.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalVideos / limitNumber);

    const data = {
        watchHistory,
        totalVideos,
        totalPages, // Fixed typo: totalpages -> totalPages
        currentPage: pageNumber, // Fixed typo: curretnPage -> currentPage
        hasMore: pageNumber < totalPages
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Watch history fetched successfully",
                data
            )
        );
};


export const removeFromWatchHistory = async (req, res) => {
    const userId = req.user.id;
    const { videoId } = req.params;

    //Validate video ID
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id", "INVALID_VIDEO_ID");
    }

    const deleted = await WatchHistory.findOneAndDelete({user: userId, video: videoId});

    if(!deleted){
        throw new ApiError(404, "Watch history not found", "WATCH_HISTORY_NOT_FOUND");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "removed from watch history",
                deleted
            )
        );

};

export const clearWatchHistory = async (req, res) => {
    const userId = req.user.id;
    // delete all watch history of user
    const deleted = await WatchHistory.deleteMany({user: userId});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deleted.deletedCount === 0 ? "No watch history found, watch history is already cleared" : "Watch history cleared",
                {deletedCount: deleted.deletedCount}
            )
        );
};
