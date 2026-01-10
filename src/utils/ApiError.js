// Custom error class that extends the native Error class.
// Used to generate consistent and structured API errors across the application.
export class ApiError extends Error {

  constructor(
    statusCode,                           // HTTP status code (e.g., 400, 404, 500)
    message = "Something went wrong",     // Human-readable error message
    code = "ERROR",                       // Short machine-readable error identifier
    details = null,                       // Additional error information (validation issues, db metadata, etc.)
    stack = null                          // Optional custom stack trace (used rarely)
  ) {

    // Call the parent Error constructor so message + native stack trace work correctly.
    super(message);

    // Store the HTTP status code to be used by the global error handler.
    this.statusCode = statusCode;

    // All ApiError instances represent failures, so success is always false.
    this.success = false;

    // Machine-readable error code for frontend or logging systems.
    // Examples: "NOT_FOUND", "INVALID_INPUT", "UNAUTHORIZED"
    this.code = code;

    // Extra internal details useful for debugging or validation.
    // This will not typically be shown to end-users in production.
    this.details = details;

    // If a custom stack trace was provided, use it.
    // Otherwise generate a clean stack trace starting from this constructor.
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
