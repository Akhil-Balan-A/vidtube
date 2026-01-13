import {z} from "zod";
import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Map through Zod issues to get a clean field-to-message mapping
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      // Pass the formatted errors to the 'details' parameter of ApiError
      return next(new ApiError(400, "Validation failed", "VALIDATION_ERROR", formattedErrors));
    }
    
    // Handle non-zod errors
    next(err);
  }
};

