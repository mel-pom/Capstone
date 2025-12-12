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
 * Axios instance configured with base URL
 * Use this for all API requests to the backend
 */
export const api = axios.create({
  baseURL: API_BASE
});
