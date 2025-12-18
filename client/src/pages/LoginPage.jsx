import { useState } from "react";
import axios from "axios";
import { getErrorMessage } from "../utils/errorHandler.js";

// API base URL from environment or default to localhost
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
console.log("API_BASE from env:", API_BASE);

/**
 * LoginPage component
 * Handles user authentication and registration, redirects to clients page on success
 */
function LoginPage() {
  // Track whether we're in login or registration mode
  const [isRegistering, setIsRegistering] = useState(false);
  // Form state for email and password
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  // Error message state
  const [error, setError] = useState("");
  // Success message state
  const [success, setSuccess] = useState("");

  /**
   * Handle form input changes
   * Updates form state with new input values
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear errors when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  /**
   * Handle login form submission
   * Authenticates user with backend and stores token in localStorage
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Send login request to backend
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email: form.email,
        password: form.password,
      });
      const token = res.data.token;
      const userEmail = res.data.user?.email;
      // Store JWT token in localStorage for future authenticated requests
      localStorage.setItem("token", token);
      // Store user email in localStorage for display purposes
      if (userEmail) {
        localStorage.setItem("userEmail", userEmail);
      }
      // Redirect to clients page after successful login
      window.location.href = "/clients";
    } catch (err) {
      console.error("Login error:", err);
      setError(getErrorMessage(err, "Login failed. Please check your credentials and try again."));
    }
  };

  /**
   * Handle registration form submission
   * Creates a new user account
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate password confirmation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Send registration request to backend
      await axios.post(`${API_BASE}/api/auth/register`, {
        email: form.email,
        password: form.password,
      });
      
      // Show success message and switch to login mode
      setSuccess("Account created successfully! Please log in.");
      setIsRegistering(false);
      // Clear password fields but keep email
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      console.error("Registration error:", err);
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    }
  };

  /**
   * Toggle between login and registration modes
   */
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setSuccess("");
    // Clear form when switching modes
    setForm({ email: "", password: "", confirmPassword: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-semibold mb-6 text-slate-900 text-center">
          Client Documentation Portal
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-100 text-green-700 px-3 py-2 text-sm">
            {success}
          </div>
        )}

        {isRegistering ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                minLength={6}
              />
              <p className="mt-1 text-xs text-slate-500">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 transition"
            >
              Create Account
            </button>

            <div className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Log In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 transition"
            >
              Log In
            </button>

            <div className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Create New Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
