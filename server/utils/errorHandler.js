/**
 * Error handling utilities
 * Provides consistent error response formatting
 */

/**
 * Handle Mongoose validation errors
 * Extracts and formats validation error messages
 */
export const handleValidationError = (err) => {
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return {
      status: 400,
      message: "Validation error",
      errors: errors,
    };
  }
  return null;
};

/**
 * Handle Mongoose duplicate key errors
 */
export const handleDuplicateKeyError = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return {
      status: 400,
      message: `${field} already exists`,
    };
  }
  return null;
};

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
export const handleCastError = (err) => {
  if (err.name === "CastError") {
    return {
      status: 400,
      message: `Invalid ${err.path}: ${err.value}`,
    };
  }
  return null;
};

/**
 * Format error response
 */
export const formatErrorResponse = (err, defaultMessage = "An error occurred") => {
  // Check for specific error types
  const validationError = handleValidationError(err);
  if (validationError) {
    return {
      status: validationError.status,
      message: validationError.message,
      errors: validationError.errors,
    };
  }

  const duplicateError = handleDuplicateKeyError(err);
  if (duplicateError) {
    return {
      status: duplicateError.status,
      message: duplicateError.message,
    };
  }

  const castError = handleCastError(err);
  if (castError) {
    return {
      status: castError.status,
      message: castError.message,
    };
  }

  // Default error
  return {
    status: err.status || 500,
    message: err.message || defaultMessage,
  };
};

