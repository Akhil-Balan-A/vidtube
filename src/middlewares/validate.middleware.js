import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body);
    next();
  } catch (err) {
    const formatted = err.errors?.map(e => ({
      field: e.path.join(".") || e.path[0],
      message: e.message
    })) || null;
    next(
      new ApiError(400, "Validation failed", "VALIDATION_ERROR", formatted)
    );
  }
};

