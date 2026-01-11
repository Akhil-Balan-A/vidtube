import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import { config } from "../config/config.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { setAuthCookies } from "../utils/cookie.js";

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  //save refresh token to database
  await User.findOneAndUpdate({ _id: userId }, { refreshToken });
  return { accessToken, refreshToken };
};

const registerUser = async (req, res) => {
  //Start transaction to track and manager user creation
  const session = await mongoose.startSession();
  session.startTransaction();
  const { username, email, password, fullName } = req.body;
  //Validate uploaded files (both should be optional)
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let avatarUpload = null;
    let coverUpload = null;
    
  try {
    //Check if the user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ApiError(409, "User already exists", "USER_ALREADY_EXISTS");
    }

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required", "AVATAR_REQUIRED");
    }

    //upload avatar (required)
    avatarUpload = await uploadOnCloudinary(avatarLocalPath, "vidtube/avatar");

    //upload cover image (optional)
    if (coverImageLocalPath) {
      coverUpload = await uploadOnCloudinary(
        coverImageLocalPath,
        "vidtube/coverImages"
      );
    }

    //create user with transaction
    const user = await User.create(
      [
        {
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          fullName,
          password,
          avatar: avatarUpload?.url || null,
          avatarPublicId: avatarUpload?.publicId || null,
          coverImage: coverUpload?.url || null,
          coverImagePublicId: coverUpload?.publicId || null,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    //sanitized response use array as session move the data to array
    const safeUser = {
      id: user[0]._id,
      username: user[0].username,
      email: user[0].email,
      fullName: user[0].fullName,
      avatar: user[0].avatar,
      coverImage: user[0].coverImage,
      createdAt: user[0].createdAt,
    };

    return res
      .status(201)
      .json(new ApiResponse(201, "User created successfully", safeUser));
  } catch (error) {
    //Rolllback Db on error
    await session.abortTransaction();
    session.endSession();

    //Delete uploaded avatar if failure happens after uploading
    if (avatarUpload?.publicId) {
      await deleteFromCloudinary(avatarUpload.publicId);
    }

    // Delete uploaded cover if failure happens after uploading

    if (coverUpload?.publicId) {
      await deleteFromCloudinary(coverUpload.publicId);
    }

    // Delete local file if failure happens after uploading
    
      if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
        console.log("avatarLocalPath - deleted" , avatarLocalPath);
      fs.unlinkSync(avatarLocalPath);
    }

      if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
        console.log("coverImageLocalPath - deleted", coverImageLocalPath);
      fs.unlinkSync(coverImageLocalPath);
    }
    // Throw any other error for global error handler
    throw new ApiError(
      500,
      "User creation error",
      "USER_CREATION_ERROR",
      error.message
    );
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email }).select("+password");
  if (!existingUser) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }
  //validate password
  const isPasswordMatched = await existingUser.isPasswordMatched(password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existingUser._id
  );

  //set cookies
  setAuthCookies(res, accessToken, refreshToken);

  const safeUser = {
    id: existingUser._id,
    username: existingUser.username,
    email: existingUser.email,
    fullName: existingUser.fullName,
  };
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Login successful", { accessToken, refreshToken })
    );
};

const refreshAccessToken = async (req, res) => {
  let incomingRefreshToken = null;

  // 1. Web — cookie
  if (req.cookies?.refreshToken) {
    incomingRefreshToken = req.cookies.refreshToken;
  }

  // 2. Mobile — Authorization header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    incomingRefreshToken = req.headers.authorization.split(" ")[1];
  }

  // 3. Mobile — body
  if (req.body?.refreshToken) {
    incomingRefreshToken = req.body.refreshToken;
  }

  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided", "NO_REFRESH_TOKEN");
  }

  try {
    // Verify token
    const decoded = jwt.verify(incomingRefreshToken, config.refreshTokenSecret);

    // Validate user
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");

    // Compare with DB
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token mismatch", "TOKEN_MISMATCH");
    }

    // New tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    // Update cookies (web)
    setAuthCookies(res, accessToken, refreshToken);

    // Response (mobile + web)
    return res.status(200).json(
      new ApiResponse(200, "Token refreshed successfully", {
        accessToken,
        refreshToken,
      })
    );
  } catch (err) {
    throw new ApiError(401, "Invalid refresh token", "INVALID_REFRESH", err);
  }
};

const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
  // Remove cookies (web)
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json(new ApiResponse(200, "Logout successful", {}));
};

export { registerUser, loginUser, refreshAccessToken, logoutUser };
