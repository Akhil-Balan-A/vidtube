import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    const formatted = err.errors?.map(e => ({
      field: e.path[0],
      message: e.message
    }));

    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", formatted);
  }
};

