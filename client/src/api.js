import axios from "axios";

/**
 * API base URL from environment variable or default to localhost
 * Set VITE_API_BASE in .env file to override
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * Generate Authorization header with Bearer token
 * Used in API requests to authenticate the user
 * @returns {Object} Headers object with Authorization if token exists, empty object otherwise
 */
export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Decode JWT token to get user information
 * @returns {Object|null} Decoded token payload with id and role, or null if token is invalid
 */
export function decodeToken() {
  const token = getToken();
  if (!token) return null;

  try {
    // JWT tokens have 3 parts: header.payload.signature
    const payload = token.split(".")[1];
    if (!payload) return null;

    // Decode base64 payload
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
}

/**
 * Get current user's role from JWT token
 * @returns {string|null} User role ('admin' or 'staff') or null if not available
 */
export function getUserRole() {
  const decoded = decodeToken();
  return decoded?.role || null;
}

/**
 * Check if current user is an admin
 * @returns {boolean} True if user is admin, false otherwise
 */
export function isAdmin() {
  return getUserRole() === "admin";
}

/**
 * Axios instance configured with base URL
 * Use this for all API requests to the backend
 */
export const api = axios.create({
  baseURL: API_BASE
});

// Add request interceptor for debugging (only in development)
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
      });
      return config;
    },
    (error) => {
      console.error("[API Request Error]", error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
      return response;
    },
    (error) => {
      console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      return Promise.reject(error);
    }
  );
}
