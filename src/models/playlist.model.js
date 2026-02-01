import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: [true, "Playlist Name is required"],
        trim: true,
        minlenght: [3, "Playlist name must be at least 3 characters long"],
        maxlength: [50, "Playlist name must be at most 50 characters long"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        minlength: [3, "Description must be at least 3 characters long"],
        maxlength: [500, "Description must be at most 500 characters long"],
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video",


    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

export const Playlist = mongoose.model("Playlist", playlistSchema);