import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders, isAdmin } from "../api";
import AppLayout from "../components/AppLayout";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

/**
 * UsersPage component
 * Admin-only page to view all users and manage their roles
 */
function UsersPage() {
  // State for users list
  const [users, setUsers] = useState([]);
  // Loading state
  const [loading, setLoading] = useState(true);
  // Error message state
  const [error, setError] = useState("");
  // Success message state
  const [success, setSuccess] = useState("");
  // Track which user's role is being updated
  const [updatingRole, setUpdatingRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and is admin
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    if (!isAdmin()) {
      setError("Access denied. Admin privileges required.");
      return;
    }

    /**
     * Fetch all users from API
     */
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        // Get users list with authentication headers
        const res = await api.get("/api/users", {
          headers: authHeaders(),
        });

        setUsers(res.data);
      } catch (err) {
        console.error("Fetch users error:", err);
        console.error("Error details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
          url: err.config?.url
        });
        
        if (isAuthError(err)) {
          if (err.response?.status === 403) {
            setError("Access denied. Admin privileges required.");
          } else {
            navigate("/");
          }
          return;
        }
        
        // Check for 404 specifically
        if (err.response?.status === 404) {
          setError("Users endpoint not found. Please check that the server is running and the route is registered.");
        } else {
          setError(getErrorMessage(err, "Failed to load users."));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  /**
   * Handle role change for a user
   */
  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingRole(userId);
      setError("");
      setSuccess("");

      // Update user role
      const res = await api.patch(
        `/api/users/${userId}/role`,
        { role: newRole },
        { headers: authHeaders() }
      );

      // Update users list with the updated user
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? res.data.user : user
        )
      );

      setSuccess(`User role updated to ${newRole} successfully.`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update role error:", err);
      if (isAuthError(err)) {
        if (err.response?.status === 403) {
          setError("You don't have permission to update user roles.");
        } else {
          navigate("/");
          return;
        }
      } else {
        setError(getErrorMessage(err, "Failed to update user role. Please try again."));
      }
    } finally {
      setUpdatingRole(null);
    }
  };

  return (
    <AppLayout
      title="User Management"
      subtitle="Manage user roles and permissions (Admin only)"
    >
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {loading ? (
        <Loader text="Loading users..." />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-sm text-slate-600">No users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={updatingRole === user._id}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      {updatingRole === user._id && (
                        <span className="ml-2 text-xs text-slate-500">Updating...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default UsersPage;
