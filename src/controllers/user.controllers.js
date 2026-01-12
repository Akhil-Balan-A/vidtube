import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


const getCurrentUser = async (req, res) => {
    // get user details
    return res.status(200).json(new ApiResponse(200,"",req.user))
    
    
}
const updateAccountInfo = async (req, res) => {
    // update user details like name,fullName,email
    const { username, fullName, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    user.username = username;
    user.fullName = fullName;
    user.email = email;
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
    
}   

const updateCoverImage = async (req, res) => {
    
}




export { getCurrentUser, updateAccountInfo, changeCurrentPassword, updateAvatar, updateCoverImage };
