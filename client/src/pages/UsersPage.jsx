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
  // State for clients list
  const [clients, setClients] = useState([]);
  // Loading state
  const [loading, setLoading] = useState(true);
  // Error message state
  const [error, setError] = useState("");
  // Success message state
  const [success, setSuccess] = useState("");
  // Track which user's role is being updated
  const [updatingRole, setUpdatingRole] = useState(null);
  // Track which user's clients are being updated
  const [updatingClients, setUpdatingClients] = useState(null);
  // Track which user's client assignment panel is open
  const [openAssignmentPanel, setOpenAssignmentPanel] = useState(null);
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
     * Fetch all users and clients from API
     */
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        // Get users list with authentication headers
        const usersRes = await api.get("/api/users", {
          headers: authHeaders(),
        });

        // Get clients list
        const clientsRes = await api.get("/api/clients", {
          headers: authHeaders(),
        });

        setUsers(usersRes.data);
        setClients(clientsRes.data);
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
   * Handle client assignment change for a user
   */
  const handleClientAssignment = async (userId, selectedClientIds) => {
    try {
      setUpdatingClients(userId);
      setError("");
      setSuccess("");

      // Update assigned clients
      const res = await api.patch(
        `/api/users/${userId}/clients`,
        { clientIds: selectedClientIds },
        { headers: authHeaders() }
      );

      // Update users list with the updated user
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? res.data.user : user
        )
      );

      setSuccess("Client assignments updated successfully.");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      // Close the assignment panel
      setOpenAssignmentPanel(null);
    } catch (err) {
      console.error("Update client assignment error:", err);
      if (isAuthError(err)) {
        if (err.response?.status === 403) {
          setError("You don't have permission to update client assignments.");
        } else {
          navigate("/");
          return;
        }
      } else {
        setError(getErrorMessage(err, "Failed to update client assignments. Please try again."));
      }
    } finally {
      setUpdatingClients(null);
    }
  };

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
      subtitle="Manage user roles and assign clients to staff (Admin only)"
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
                    Assigned Clients
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => {
                  const assignedClientIds = user.assignedClients?.map(c => c._id || c) || [];
                  const isPanelOpen = openAssignmentPanel === user._id;
                  
                  return (
                    <>
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
                          {assignedClientIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.assignedClients?.map((client) => (
                                <span
                                  key={client._id || client}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                  {typeof client === 'object' ? client.name : 'Loading...'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No clients assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            {user.role === "staff" && (
                              <button
                                onClick={() => setOpenAssignmentPanel(isPanelOpen ? null : user._id)}
                                className="text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition"
                                disabled={updatingClients === user._id}
                              >
                                {isPanelOpen ? "Cancel" : "Assign Clients"}
                              </button>
                            )}
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
                              <span className="text-xs text-slate-500">Updating...</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isPanelOpen && user.role === "staff" && (
                        <tr>
                          <td colSpan="4" className="px-4 py-4 bg-slate-50">
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-slate-900">
                                Assign Clients to {user.email}
                              </h4>
                              {clients.length === 0 ? (
                                <p className="text-xs text-slate-500">No clients available to assign.</p>
                              ) : (
                                <div className="space-y-2">
                                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md p-2 bg-white">
                                    {clients.map((client) => {
                                      const isAssigned = assignedClientIds.includes(client._id);
                                      return (
                                        <label
                                          key={client._id}
                                          className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isAssigned}
                                            onChange={(e) => {
                                              const newSelectedIds = e.target.checked
                                                ? [...assignedClientIds, client._id]
                                                : assignedClientIds.filter(id => id !== client._id);
                                              handleClientAssignment(user._id, newSelectedIds);
                                            }}
                                            disabled={updatingClients === user._id}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <span className="text-sm text-slate-700">{client.name}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleClientAssignment(user._id, [])}
                                      disabled={updatingClients === user._id}
                                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition disabled:opacity-50"
                                    >
                                      Clear All
                                    </button>
                                    {updatingClients === user._id && (
                                      <span className="text-xs text-slate-500">Updating...</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default UsersPage;
