import "dotenv/config";

export const config = {
    port: process.env.PORT || 3000,
    corsOrigin: process.env.CORS_ORIGIN,
    mongodbUri: process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET 

};