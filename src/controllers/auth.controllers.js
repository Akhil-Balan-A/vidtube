import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import { config } from "../config/config.js";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { setAuthCookies } from "../utils/cookie.js";
import { sendWelcomeEmail, sendForgotPasswordResetEmail } from "../utils/sendEmail.js";


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

    //send welcome email with soft-fail
    try {
      const verifyToken = user[0].generateEmailVerificationToken();
      await user[0].save({validateBeforeSave: false});
      await sendWelcomeEmail(user[0].email, user[0].username, verifyToken);
    } catch (error) {
      //log error using logger instead of console
      logger.error(`❌ Failed to send welcome email to ${user[0].email}: ${error.message}`);  

    }

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
    //Commit transaction
     await session.commitTransaction();
    session.endSession();
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
        // since project hs logger . logger is bettrer than console log
      // console.log("avatarLocalPath - deleted" , avatarLocalPath);
      logger.info("avatarLocalPath - deleted" , avatarLocalPath);
      fs.unlinkSync(avatarLocalPath);
    }

      if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
        // console.log("coverImageLocalPath - deleted", coverImageLocalPath);
        logger.info("coverImageLocalPath - deleted", coverImageLocalPath);
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
    const user = await User.findById(decoded.id).select("+refreshToken");
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
  const user = await User.findById(req.user.id).select("+refreshToken");
  if(!user)
    throw new ApiError(404, "User not found","USER_NOT_FOUND");
  user.refreshToken = null;
  await user.save();
  // Remove cookies (web)
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json(new ApiResponse(200, "Logout successful", {}));
};

const verifyEmail = async (req, res) => {
  const { code } = req.params;

  if (!code) {
    throw new ApiError(400, "Verification code is missing", "MISSING_CODE");
  }

  // Find user with this token
  const user = await User.findOne({ 
    emailVerificationToken: code,
    emailVerificationTokenExpiry: { $gt: Date.now() }, // Token must be valid
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification code", "INVALID_CODE");
  }

  // Update user
  user.isEmailVerified = true;
  user.emailVerificationToken = null; // Clear token
  user.emailVerificationTokenExpiry = null;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, "Email verified successfully", {}));
};

const resendVerificationEmail = async(req,res)=>{
  const user = await User.findById(req.user.id);
  if(!user)
    throw new ApiError(404, "User not found","USER_NOT_FOUND");
  if(user.isEmailVerified)
    throw new ApiError(400, "Email already verified, No further action required","EMAIL_ALREADY_VERIFIED");
  
  const verifyToken = user.generateEmailVerificationToken(); // here we are generating the verification token, expiry time to the user document object..important thing is it just added to the obje not yet saved. so save it. 
  await user.save({ validateBeforeSave: false });

  await sendWelcomeEmail(user.email,user.username,verifyToken);

  return res.status(200).json(new ApiResponse(200,"Verification email sent successfully",{}));

}

// let the app know i am not able to login since i dont know password..
const forgotPasswordRequest = async(req,res)=>{
  const {email} = req.body;
  const user = await User.findOne({email});
  if(!user)
    throw new ApiError(404, "User not found","USER_NOT_FOUND");
  //Generate the token(this saves the token and expiry time to the user document)
  const resetToken = user.generateForgotPasswordResetToken();
  await user.save({ validateBeforeSave: false });//saved the token and expiry time which get  added in the modle document.
  try{
    await sendForgotPasswordResetEmail(user.email,user.username,resetToken);
  }catch(err){
    //if email fails to send, remove the token and expiry time from the user document
    user.forgotPasswordResetToken = undefined;
    user.forgotPasswordResetTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500,"Failed to send forgot password reset email","FAILED_TO_SEND_FORGOT_PASSWORD_RESET_EMAIL",err);

  }

  return res.status(200).json(new ApiResponse(200,"Forgot password request successful, check your email for reset password link",{}));
 
}

// one the forget password request accepts the email and sends a reset password link to the user email
// using that link user can reset the password
const resetPassword = async(req,res)=>{
  //hash the token frm the URL to compare with db 
  const {token} = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswordResetToken: hashedToken,
    forgotPasswordResetTokenExpiry: { $gt: Date.now() },
  }).select("+password");

  if(!user)
    throw new ApiError(404, "Token is invalid or has expired","INVALID_TOKEN");

  //UPDATE THE PASSWORD AND RESET THE FIELDS

  const {password, confirmPassword} = req.body;
  //Zod alread catch the below login
  // if(password !== confirmPassword)
  //   throw new ApiError(400, "Passwords do not match","PASSWORDS_DO_NOT_MATCH"); 
  user.password = password;
  user.forgotPasswordResetToken = undefined;
  user.forgotPasswordResetTokenExpiry = undefined;
  await user.save({ validateBeforeSave: true });//since we are updating the password we need to validate it.
 
  return res.status(200).json(new ApiResponse(200,"Password updated successfully",{}));
}

export { registerUser, loginUser, refreshAccessToken, logoutUser, verifyEmail,resendVerificationEmail,resetPassword,forgotPasswordRequest };
