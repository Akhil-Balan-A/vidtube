import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String, //cloudinary URL
        required: [true, "Video file is required"]  
    },
    // Store the public_id from cloudinary to make deleting files easier later.
    publicId: {
        type: String,
        required: true  
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        minlength: [3, "Title must be at least 3 characters long"],
        maxlength: [100, "Title must be at most 50 characters long"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxLength: [500, "Description must be at most 500 characters long"],
    },
    thumbnail: {
        type: String, //cloudinary URL
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,//Cloudinary provides duration automatically on upload
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
}, {
    timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);


