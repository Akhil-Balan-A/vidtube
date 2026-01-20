import { v2 as cloudinary } from 'cloudinary'
import { config } from "../config/config.js";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

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
const uploadOnCloudinary = async (localFilePath, folder="vidtube") => {//default folder fall back storage
    try {
        //if no local path throw error
        if (!localFilePath) {
            throw new ApiError(400, "File is required", "FILE_REQUIRED");
        } ;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder: folder // this will make all files uploaded to this folder
        });
        logger.info("📤 Cloudinary upload success:", response.secure_url);

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
        logger.error("❌ Cloudinary upload error:", error.message);
        //Delete file if exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw new ApiError(500, "Cloudinary upload error", "UPLOAD_ERROR", error);
    }
}


const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) throw new ApiError(400, "Public id is required", "PUBLIC_ID_REQUIRED");
        //for upload we can use auto but for delete we need to specify what type of file is being deleted
        const fileInfo = await cloudinary.api.resource(publicId);
        const resourceType = fileInfo.resource_type; // image or video or row 
        logger.info("📤 Cloudinary delete success:", publicId, resourceType);
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        logger.info("📤 Cloudinary delete success:", publicId, response.result);
    } catch (error) {
        logger.error("❌ Cloudinary delete error:", error.message);
        throw new ApiError(500, "Cloudinary delete error", "DELETE_ERROR", error);
    }
}


export {
    uploadOnCloudinary,
    deleteFromCloudinary
};
