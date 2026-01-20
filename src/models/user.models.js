import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [20, "Username must be at most 20 characters long"],
        index: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Full name must be at least 3 characters long"],
        maxlength: [50, "Full name must be at most 50 characters long"],
        match: [/^[A-Za-z\s]+$/, "Name can only contain alphabets"]
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please fill a valid email address"],
        index: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationTokenExpiry: {
        type: Date,
        default: null
    },
    avatar: {
        type: String, //cloudinary URL
        required: true
    },
    avatarPublicId: {
        type: String,
        required: true
    },
    coverImage: {
        type: String, //cloudinary URL
        default: null   
    },
    coverImagePublicId: {
        type: String,
        default: null
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"

        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
        maxlength: [60, "Password must be at most 60 characters long"],
        select: false // Hides password from default queries
    },
    forgotPasswordResetToken: {
        type: String,
        default: null
    },
    forgotPasswordResetTokenExpiry: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String,
        select: false // Hides refreshToken from default queries
    },
},
    {
        timestamps: true
    }
);

// password handling if the hook is async dont call next()
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {//if password is not modified then do nothing
        return
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordMatched = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    //short lived access token
    return jwt.sign({ id: this._id, username: this.username, email: this.email }, config.accessTokenSecret, { expiresIn: config.accessTokenExpiry });
}

userSchema.methods.generateRefreshToken = function () {
    //long lived refresh token
    return jwt.sign({ id: this._id}, config.refreshTokenSecret, { expiresIn: config.refreshTokenExpiry });
}

userSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomInt(100000, 999999).toString();
  this.emailVerificationToken = verificationToken;// here we are setting the verification token in the user document
  this.emailVerificationTokenExpiry = Date.now() + 3600000; // 1 hour
  return verificationToken;
}

userSchema.methods.generateForgotPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.forgotPasswordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.forgotPasswordResetTokenExpiry = Date.now() + 3600000; // 1 hour
    return resetToken;
}


export const User = mongoose.model("User", userSchema);

