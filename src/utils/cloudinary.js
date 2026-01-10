import { v2 as cloudinary } from 'cloudinary'
import { config } from "../config/config.js";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

//Config Cloudinary
cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret
});

/**
 * Uploads a file to Cloudinary and deletes the local file afterward.
 * Supports images & videos automatically.
 */
const uploadOnCloudinary = async (localFilePath, folder="vidtube/upload") => {//default folder fall back storage
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        console.log("📤 Cloudinary upload success:", response.secure_url);

        // Delete local file once the files is uploaded
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        // Return only useful data
        return {
            url: response.secure_url,
            publicId: response.public_id,
            format: response.format,
            duration: response.duration || null,
            type: response.resource_type,
        };

    } catch (error) {
        console.error("❌ Cloudinary upload error:", error.message);
        //Delete file if exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw new ApiError(500, "Cloudinary upload error", "UPLOAD_ERROR", error);
    }
}

export { uploadOnCloudinary }
