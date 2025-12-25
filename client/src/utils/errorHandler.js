/**
 * Frontend error handling utilities
 * Provides consistent error message extraction and formatting
 */

/**
 * Extract user-friendly error message from API error response
 * @param {Error} error - Axios error object
 * @param {string} defaultMessage - Default message if error cannot be parsed
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = "An error occurred") => {
  // Network error (no response from server)
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return "Request timed out. Please check your connection and try again.";
    }
    if (error.message?.includes("Network Error")) {
      return "Network error. Please check your internet connection and try again.";
    }
    return "Unable to connect to server. Please try again later.";
  }

  // Server responded with error
  const status = error.response.status;
  const data = error.response.data;

  // Extract error message from response
  let message = data?.error || data?.message || defaultMessage;

  // Handle validation errors array
  if (data?.errors && Array.isArray(data.errors)) {
    message = data.errors.join(". ");
  }

  // Add context based on status code
  // Note: For 401, use the server's message if available (e.g., "Invalid email or password")
  // Otherwise, show generic session expired message
  switch (status) {
    case 400:
      return message || "Invalid request. Please check your input and try again.";
    case 401:
      // Use server message if available (for login errors), otherwise show session expired
      return message || "Your session has expired. Please log in again.";
    case 403:
      return message || "You don't have permission to perform this action.";
    case 404:
      return message || "The requested resource was not found.";
    case 409:
      return message || "A conflict occurred. Please refresh and try again.";
    case 422:
      return message || "Validation error. Please check your input.";
    case 500:
      return "Server error. Please try again later.";
    case 503:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return message || defaultMessage;
  }
};

/**
 * Check if error is an authentication error
 * @param {Error} error - Axios error object
 * @returns {boolean} True if error is authentication-related
 */
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Check if error is a network error
 * @param {Error} error - Axios error object
 * @returns {boolean} True if error is network-related
 */
export const isNetworkError = (error) => {
  return !error.response || error.code === "ECONNABORTED" || error.message?.includes("Network Error");
};

