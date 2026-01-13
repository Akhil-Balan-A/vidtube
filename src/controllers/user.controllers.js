import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getCurrentUser = async (req, res) => {
    // get user details
    return res.status(200).json(new ApiResponse(200,"",req.user))
    
    
}
const updateAccountInfo = async (req, res) => {
    // update user details like name,fullName,email
    const { username, fullName, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    // user may change any or all of the user info
    if (username) user.username = username;
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    await user.save({ validateBeforeSave: false });//will save only what is modified
    return res.status(200).json(new ApiResponse(200, "Account info updated successfully", {user}));
}



const changeCurrentPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    const isPasswordMatched = await user.isPasswordMatched(currentPassword);
    if (!isPasswordMatched) throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });//will save only what is modified
    return res.status(200).json(new ApiResponse(200, "Password changed successfully", {}));
}


const updateAvatar = async (req, res) => {
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required", "AVATAR_REQUIRED");
    const avatarUpload = await uploadOnCloudinary(avatarLocalPath, "vidtube/avatar");
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    if(avatarUpload) user.avatar = avatarUpload.url;
    await user.save({ validateBeforeSave: false });//will save only what is modified
    return res.status(200).json(new ApiResponse(200, "Avatar updated successfully", {user}));     
}   


const updateCoverImage = async (req, res) => {
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    if (!coverImageLocalPath) throw new ApiError(400, "Cover image is required", "COVER_IMAGE_REQUIRED");
    coverUpload = await uploadOnCloudinary(coverImageLocalPath, "vidtube/coverImage");
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    if(coverUpload) user.coverImage = coverUpload.url;
    await user.save({ validateBeforeSave: false });//will save only what is modified
    return res.status(200).json(new ApiResponse(200, "Cover image updated successfully", {user}));
    
}




export { getCurrentUser, updateAccountInfo, changeCurrentPassword, updateAvatar, updateCoverImage };
