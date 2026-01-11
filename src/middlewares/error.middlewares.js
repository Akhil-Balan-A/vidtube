import mongoose from "mongoose";
import { config } from "../config/config.js"
import { ApiError } from "../utils/ApiError.js";
import multer from "multer";


const errorHandler = (err, req, res, next) => {
    // If this is our custom ApiError class
    if (err instanceof ApiError) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
            code: err.code || "ERROR",
            details: err.details || null,
            // Remove stack trace in production
            stack: config.nodeEnv === "development" ? err.stack : undefined
        });
    }

    // If this is a mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            success: false,
            message: "Mongoose validation failed",
            code: "VALIDATION_ERROR",
            details: err.errors,
            stack: config.nodeEnv === "development" ? err.stack : undefined
        });
    }
    // if this is a multer error
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: "Multer error",
            code: "MULTER_ERROR",
            details: err.message,
            stack: config.nodeEnv === "development" ? err.stack : undefined
        });
    }

    // Unknown/unhandled errors
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        code: "INTERNAL_ERROR",
        details: err.message,
        stack: config.nodeEnv === "development" ? err.stack : undefined // this will make sure that we get the full stack trace
    });
};

export { errorHandler };