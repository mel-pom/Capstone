import { useState } from "react";
import axios from "axios";

// API base URL from environment or default to localhost
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
console.log("API_BASE from env:", API_BASE);

/**
 * LoginPage component
 * Handles user authentication and redirects to clients page on success
 */
function LoginPage() {
  // Form state for email and password
  const [form, setForm] = useState({ email: "", password: "" });
  // Error message state
  const [error, setError] = useState("");

  /**
   * Handle form input changes
   * Updates form state with new input values
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Handle form submission
   * Authenticates user with backend and stores token in localStorage
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Send login request to backend
      const res = await axios.post(`${API_BASE}/api/auth/login`, form);
      const token = res.data.token;
      // Store JWT token in localStorage for future authenticated requests
      localStorage.setItem("token", token);
      // Redirect to clients page after successful login
      window.location.href = "/clients";
    } catch (err) {
      console.error(err);
      // Display error message from server or generic error
      setError(err.response?.data?.error || "Login failed");
    }
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
