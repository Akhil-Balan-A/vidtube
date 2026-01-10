import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { th } from "zod/locales";

const registerUser = async (req, res) => {
    const { username, email, password, fullName } = req.body;
    //Check if the user already exists
    const existingUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists", "USER_ALREADY_EXISTS");
    }
    //Validate uploaded files (both should be optional)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required", "AVATAR_REQUIRED");
    }

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
    let coverUpload = null;
    if (coverImageLocalPath) {
         coverUpload = await uploadOnCloudinary(coverImageLocalPath);
    }

    const createdUser = await User.create({
        username,
        email,
        fullName,
        password,
        avatar: avatarUpload?.url || null,
        coverImage: coverUpload?.url || null,
    });

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    const safeUser = {
        id: createdUser._id,
        username: createdUser.username,
        email: createdUser.email,
        fullName: createdUser.fullName,
        avatar: createdUser.avatar,
        coverImage: createdUser.coverImage,
        createdAt: createdUser.createdAt,
    };
    return res.status(201).json(new ApiResponse(201, "User created successfully", safeUser));
}
const loginUser = async (req, res) => {
    //todo
}

export {
    registerUser,
    loginUser,

}

