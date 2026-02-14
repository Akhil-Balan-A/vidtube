import { ApiResponse, ApiError } from "#utils";
import { Playlist, User, Video } from "#models"; 
import mongoose from "mongoose";

//Creates new playlist owned by user.
export const createPlaylist = async (req, res) => {
    const userId = req.user.id;
    const { name, description, isPublic } = req.body;

    const playlist = await Playlist.create({
        name,
        description,
        owner: userId,
        videos: [],
        isPublic
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                "Playlist created successfully",
                playlist
            )
        );
};

//Get all playlists of a user (if owner show all, else show only public)
export const getUserPlaylists = async (req, res) => {
    const { userId } = req.params; // Id of the user whose playlists are to be fetched
    const viewerId = req.user?.id || null; // Logged-in viewer if logged in else null

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id", "INVALID_USER_ID");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    // Build query based on ownership
    const query = { owner: userId };
    
    // If viewer is NOT the owner, they can only see public playlists
    if (!viewerId || viewerId.toString() !== userId.toString()) {
        query.isPublic = true;
    }

    const playlists = await Playlist.find(query).sort({ updatedAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Playlists fetched successfully",
                playlists
            )
        );
};

//Add video to playlist
export const addVideoToPlaylist = async (req,res)=>{
    const userId = req.user.id;
    const {playlistId,videoId} = req.params;

    //validate playlistId and videoId
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist ID","INVALID_PLAYLIST_ID");
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID","INVALID_VIDEO_ID");
    }

    //Ensure playlist exists
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found","PLAYLIST_NOT_FOUND");
    }

    //Ensure user is the owner
    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(403, "User is not the owner of the playlist","UNAUTHORIZED");
    }

    //Ensure video exists
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found","VIDEO_NOT_FOUND");
    }

    //Check if video is already in playlist
    if(playlist.videos.some(id => id.toString() === videoId)){
        throw new ApiError(400, "Video is already in playlist","VIDEO_ALREADY_IN_PLAYLIST");
    }

    //atomic update (prevents duplicates)
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: videoId } // addtoset only adds the value if it is not already present in the array. if already video id present then it wont add there by avoid duplicate video id in playlist.
        },
        {
            new: true, //used to alway return updated playlist
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video added to playlist successfully",
                updatedPlaylist
            )
        );
    
}


//Update playlist (name, description, isPublic)
export const updatePlaylist = async (req,res)=>{
    const userId = req.user.id;
    const {playlistId} = req.params;
    const {name,description,isPublic} = req.body;

    //validate playlistId
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist ID","INVALID_PLAYLIST_ID");
    }

    //Ensure playlist exists
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found","PLAYLIST_NOT_FOUND");
    }

    //Ensure user is the owner
    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(403, "User is not the owner of the playlist","UNAUTHORIZED");
    }

    // build update object safely to prevent undefined overwrite when used only update only some of the fields.

    const updateFields = {};
    if(name !== undefined){
        updateFields.name = name;
    }
    if(description !== undefined){
        updateFields.description = description;
    }
    if(isPublic !== undefined){
        updateFields.isPublic = isPublic;
    }

    //optional gurad (prevents empty updates)
    if(Object.keys(updateFields).length === 0){
        throw new ApiError(400, "No fields to update","NO_FIELDS_TO_UPDATE");
    }

    //update playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: updateFields // used to update only the fields that are provided and set will update the value if the field is present in the update object. if the field is not present in the update object then it will not update the value.
        },
        {
            new: true,
        }
    );


        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Playlist updated successfully",
                updatedPlaylist
            )
        );
    
}

//Remove video from playlist
export const removeVideoFromPlaylist = async (req,res)=>{
    const userId = req.user.id;
    const {playlistId,videoId} = req.params;

    //validate playlistId and videoId
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist ID","INVALID_PLAYLIST_ID");
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID","INVALID_VIDEO_ID");
    }

    //Ensure playlist exists
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found","PLAYLIST_NOT_FOUND");
    }

    //Ensure user is the owner
    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(403, "User is not the owner of the playlist","UNAUTHORIZED");
    }

    //Ensure video exists
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found","VIDEO_NOT_FOUND");
    }

    //Check if video is already in playlist
    if(!playlist.videos.some(id => id.toString() === videoId)){
        throw new ApiError(400, "Video is not in playlist","VIDEO_NOT_IN_PLAYLIST");
    }

    //atomic update (prevents duplicates)
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId } // pull removes the value from the array. if the value is not present in the array then it will not remove the value.
        },
        {
            new: true, //used to alway return updated playlist
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video removed from playlist successfully",
                updatedPlaylist
            )
        );
    
}

//Delete playlist
export const deletePlaylist = async (req,res)=>{
    const userId = req.user.id;
    const {playlistId} = req.params;

    //validate playlistId
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist ID","INVALID_PLAYLIST_ID");
    }

    //Ensure playlist exists
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found","PLAYLIST_NOT_FOUND");
    }

    //Ensure user is the owner
    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(403, "User is not the owner of the playlist","UNAUTHORIZED");
    }

    //delete playlist
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Playlist deleted successfully",
                deletedPlaylist
            )
        );
    
}



