import { Video } from "#models";
import fs from "fs";
import { ApiResponse, ApiError, uploadOnCloudinary, deleteFromCloudinary, logger } from "#utils";

const uploadVideo = async (req, res) => {
  const { title, description,isPublished } = req.body;
  const { id } = req.user;

  //get file path from multer
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  let videoUpload = null;
  let thumbnailUpload = null;

  try {
    //validate file path
    if (!videoFileLocalPath)
      throw new ApiError(400, "Video file is required", "VIDEO_FILE_REQUIRED");

    //upload video file on cloudinary
    videoUpload = await uploadOnCloudinary(
      videoFileLocalPath,
      "vidtube/videos"
    );

    //upload thumbnail on cloudinary
    if (thumbnailLocalPath) {
      thumbnailUpload = await uploadOnCloudinary(
        thumbnailLocalPath,
        "vidtube/thumbnails"
      );
    }

    //create video in db
    const video = await Video.create({
      title,
      description,
      videoFile: videoUpload.url,
      thumbnail: thumbnailUpload?.url || null,
      owner: id,
      isPublished,
      publicId: videoUpload.publicId,
      thumbnailPublicId: thumbnailUpload?.publicId || null,
      duration: videoUpload.duration || 0,
    });

    //return response
    return res
      .status(201)
      .json(new ApiResponse(201, "Video uploaded successfully", video));
  } catch (error) {
    //delete local files
    if (videoUpload.publicId) {
      await deleteFromCloudinary(videoUpload.publicId, "video");
    }
    if (thumbnailUpload?.publicId) {
      await deleteFromCloudinary(thumbnailUpload.publicId);
    }

    //delete local files
    if (videoFileLocalPath && fs.existsSync(videoFileLocalPath)) {
      fs.unlinkSync(videoFileLocalPath);
    }
    if (thumbnailLocalPath && fs.existsSync(thumbnailLocalPath)) {
      fs.unlinkSync(thumbnailLocalPath);
    }
    //Throw any other error for global error handler
    throw new ApiError(
      500,
      "Video upload error",
      "VIDEO_UPLOAD_ERROR",
      error.message
    );
  }
};

const getAllVideos = async (req, res) => {
  // Extract query parameters from the request
  // Default values: page=1, limit=10, sortBy=createdAt, order=desc
  const {
    page = 1, // Which page of results to show
    limit = 10, // How many videos per page
    sortBy = "createdAt", // Field to sort by (createdAt, views, likes, title)
    order = "desc", // Sort order: 'asc' (ascending) or 'desc' (descending)
    search = "", // Search term for title/description
    userId = "", // Filter by specific user/channel
  } = req.query;

  // Build the filter object for MongoDB query
  const filter = {
    isPublished: true, // Only show published videos
  };

  // If search term provided, search in title and description
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } }, // Case-insensitive search in title
      { description: { $regex: search, $options: "i" } }, // Case-insensitive search in description
    ];
  }

  // If userId provided, filter by owner
  if (userId) {
    filter.owner = userId;
  }

  // Build sort object
  // Example: { createdAt: -1 } for newest first, { views: -1 } for most viewed
  const sortOrder = order === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  // Calculate how many documents to skip for pagination
  // Example: page=2, limit=10 → skip first 10 videos
  const skip = (page - 1) * limit;

  // Execute the database query
  const videos = await Video.find(filter)
    .populate("owner", "username fullName avatar") // Get owner details (only these fields)
    .sort(sort) // Sort results
    .skip(skip) // Skip for pagination
    .limit(parseInt(limit)) // Limit results per page
    .select("-publicId -thumbnailPublicId"); // Exclude cloudinary IDs from response

  // Count total videos matching the filter (for pagination info)
  const totalVideos = await Video.countDocuments(filter);

  // Calculate total pages
  const totalPages = Math.ceil(totalVideos / limit);

  // Prepare response with videos and pagination info
  const response = {
    videos,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalVideos,
      videosPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };

  // Send success response
  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", response));
};

const viewVideo = async (req, res) => {
  const { id } = req.params; // Use 'id' to match your route /:id
  const loggedInUserId = req.user?.id || null;

  // 1. Fetch video and populate owner details
  const video = await Video.findById(id).populate(
    "owner",
    "username fullName avatar"
  );

  if (!video) {
    throw new ApiError(404, "Video not found", "VIDEO_NOT_FOUND");
  }

  // 2. Authorization logic - Check if user can view unpublished video
  const isOwner =
    loggedInUserId && video.owner._id.toString() === loggedInUserId;

  if (!video.isPublished && !isOwner) {
    throw new ApiError(403, "This video is private", "VIDEO_PRIVATE");
  }

  // 3. Increment views for EVERYONE (anonymous + logged-in)
  const videodata = await Video.findByIdAndUpdate(
    
    id, { $inc: { views: 1 } },{new:true}// Returns updated document when added the object{new:true}, else returns old document

  );
  // 4. Return video (no need to manually prepare response, just return video)
  return res
    .status(200)
    .json(new ApiResponse(200, "Video viewed successfully", videodata));
};

const updateVideo = async (req, res) => {
  const { id } = req.params;
  const { title, description, isPublished } = req.body;
  const loggedInUserId = req.user?.id;

  //get new thumbnail
  const thumbnailLocalPath = req.file?.path;
  let thumbnailUpload = null;
  let oldThumbnailPublicId = null;

  try {
    // find the video
    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(404, "Video not found", "VIDEO_NOT_FOUND");
    }

    // check authorization
    if (video.owner.toString() !== loggedInUserId) {
      throw new ApiError(
        403,
        "You are not authorized to update this video",
        "UNAUTHORIZED"
      );
    }

    //Update text fields if provided
    if (title) video.title = title;
    if (description) video.description = description;
    if (isPublished !== undefined) video.isPublished = isPublished;

    //Update thumbnail if provided
    if (thumbnailLocalPath) {
      //save old thumbnail publicId for cleanup
      oldThumbnailPublicId = video.thumbnailPublicId;

      //upload new thumbnail to cloudinary
      thumbnailUpload = await uploadOnCloudinary(
        thumbnailLocalPath,
        "vidtube/thumbnails"
      );
      if (!thumbnailUpload) {
        throw new ApiError(
          400,
          "Thumbnail upload failed",
          "THUMBNAIL_UPLOAD_FAILED"
        );
      }
      //update video with new thumbnail
      video.thumbnail = thumbnailUpload.url;
      video.thumbnailPublicId = thumbnailUpload.publicId;
    }

    // save updated video
    await video.save({ validateBeforeSave: false }); // validateBeforeSave:false is used to skip the validation of the video schema. it only update the changed fields.

    //delete old thumbnail from cloudinary if new one uploaded
    if (oldThumbnailPublicId) {
      await deleteFromCloudinary(oldThumbnailPublicId);
    }

    //Return updated video
    return res
      .status(200)
      .json(new ApiResponse(200, "Video updated successfully", video));
  } catch (error) {
    logger.error("❌ Video update error:", error.message);

    //cleanup: Delte newly uploaded thumnail if update failed
    if (thumbnailUpload?.publicId) {
      try {
        await deleteFromCloudinary(thumbnailUpload?.publicId);
      } catch (error) {
        logger.error("❌ Thumbnail delete error:", error.message);
      }
    }

    //Re-throw error for global error handler
    throw error;
  }
};

const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const loggedInUserId = req.user?.id;

  try {
    const video = await Video.findById(id);

    if (!video) {
        throw new ApiError(404, "Video not found", "VIDEO_NOT_FOUND");
    }

    if (video.owner.toString() !== loggedInUserId) {
        throw new ApiError(403, "You are not authorized to delete this video", "UNAUTHORIZED");
    }

    // Delete video and thumbnail from Cloudinary
    if (video.publicId) {
        await deleteFromCloudinary(video.publicId, "video");
    }
    
    if (video.thumbnailPublicId) {
        await deleteFromCloudinary(video.thumbnailPublicId);
    }

    await Video.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, "Video deleted successfully"));

  } catch (error) {
    logger.error("❌ Delete video error:", error.message);
    throw error;
  }
};

const togglePublishStatus = async (req, res) => {
    const { id } = req.params;
    const loggedInUserId = req.user?.id;

    const video = await Video.findById(id);

    if (!video) {
        throw new ApiError(404, "Video not found", "VIDEO_NOT_FOUND");
    }

    if (video.owner.toString() !== loggedInUserId) {
        throw new ApiError(403, "You are not authorized to perform this action", "UNAUTHORIZED");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Video publish status toggled", { isPublished: video.isPublished }));
};


export { uploadVideo, getAllVideos, viewVideo, updateVideo, deleteVideo, togglePublishStatus };
