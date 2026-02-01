import { z } from "zod";
import { ApiError, logger } from "#utils";
import fs from "fs";

export const validate = (schema) => async (req, res, next) => {
  try {
    // Try to validate the request body against the provided Zod schema
    await schema.parseAsync(req.body);
    // If validation passes, move to the next middleware
    next();
  } catch (err) {
    // If validation fails, we end up here
    logger.error("Validation error:", err);

    // Clean up ALL uploaded files (works for any field names)
    if (req.files) {
      // req.files is an object that looks like this:
      // For video upload: { videoFile: [file1], thumbnail: [file2] }
      // For registration: { avatar: [file1], coverImage: [file2] }
      
      // Object.keys() gets all the field names as an array
      // Example: ['videoFile', 'thumbnail'] or ['avatar', 'coverImage']
      Object.keys(req.files).forEach((fieldName) => {
        // For each field name (e.g., 'videoFile'), get the array of files
        // req.files[fieldName] is an array because multer stores files as arrays
        // Example: req.files['videoFile'] = [{ path: 'temp/video.mp4', ... }]
        
        req.files[fieldName].forEach((file) => {
          // Loop through each file in the array (usually just 1 file per field)
          // 'file' is an object with properties like: path, filename, size, etc.
          
          try {
            // Check if the file actually exists on disk before trying to delete
            // file.path is the full path like: 'public/temp/1234567890-video.mp4'
            if (fs.existsSync(file.path)) {
              // Delete the file from the temp folder
              fs.unlinkSync(file.path);
              // Log success for debugging
              logger.info(`🗑️ Deleted: ${file.path}`);
            }
          } catch (deleteErr) {
            // If deletion fails (file locked, permissions issue, etc.)
            // Don't crash - just log the error and continue
            logger.error(`❌ Delete failed: ${file.path}`);
          }
        });
      });
    }

    // Check if the error is a Zod validation error
    if (err instanceof z.ZodError) {
      // Format the Zod errors into a clean structure
      // err.errors is an array like: [{ path: ['title'], message: 'Title is required' }]
      const formattedErrors =
        err.errors?.map((e) => ({
          field: e.path.join("."), // Convert ['title'] to 'title' or ['user', 'name'] to 'user.name'
          message: e.message,       // The error message
        })) || [];

      // Send formatted validation error to the client
      return next(
        new ApiError(
          400,
          "Validation failed",
          "VALIDATION_ERROR",
          formattedErrors
        )
      );
    }

    // If it's not a Zod error, pass it to the global error handler
    next(err);
  }
};
