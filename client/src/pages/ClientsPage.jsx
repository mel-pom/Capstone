import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, authHeaders, isAdmin } from "../api";
import AppLayout from "../components/AppLayout";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import ConfirmDialog from "../components/ConfirmDialog";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

/**
 * ClientsPage component
 * Displays list of all clients with links to their detail pages
 */
function ClientsPage() {
  // State for clients list
  const [clients, setClients] = useState([]);
  // Loading state
  const [loading, setLoading] = useState(true);
  // Error message state
  const [error, setError] = useState("");
  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    clientId: null,
    clientName: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login if no token
      navigate("/");
      return;
    }

    /**
     * Fetch all clients from API
     */
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError("");

        // Get clients list with authentication headers
        const res = await api.get("/api/clients", {
          headers: authHeaders(),
        });

        setClients(res.data);
      } catch (err) {
        console.error("Fetch clients error:", err);
        if (isAuthError(err)) {
          navigate("/");
          return;
        }
        setError(getErrorMessage(err, "Failed to load clients."));
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [navigate]);

  /**
   * Handle delete client confirmation
   */
  const handleDeleteClick = (clientId, clientName) => {
    setDeleteConfirm({
      isOpen: true,
      clientId,
      clientName,
    });
  };

  /**
   * Handle confirmed client deletion
   */
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.clientId) return;

    try {
      setError("");
      await api.delete(`/api/clients/${deleteConfirm.clientId}`, {
        headers: authHeaders(),
      });

      // Close dialog and refresh clients list
      setDeleteConfirm({ isOpen: false, clientId: null, clientName: "" });
      
      // Refresh clients list
      const res = await api.get("/api/clients", {
        headers: authHeaders(),
      });
      setClients(res.data);
    } catch (err) {
      console.error("Delete client error:", err);
      if (isAuthError(err)) {
        if (err.response?.status === 403) {
          setError(getErrorMessage(err, "You don't have permission to delete clients. Admin access required."));
        } else {
          navigate("/");
          return;
        }
      } else {
        setError(getErrorMessage(err, "Failed to delete client. Please try again."));
      }
      setDeleteConfirm({ isOpen: false, clientId: null, clientName: "" });
    }
  };

  /**
   * Handle delete cancellation
   */
  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, clientId: null, clientName: "" });
  };

  return (
    <AppLayout
      title="Clients"
      subtitle="Select a client to view their daily documentation."
      actions={
        isAdmin() && (
          <Link
            to="/clients/new"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-3 py-2 hover:bg-indigo-700 transition"
          >
            + New Client
          </Link>
        )
      }
    >
      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <Loader text="Loading clients..." />
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          {isAdmin() ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                No clients yet. Create your first client to get started.
              </p>
              <Link
                to="/clients/new"
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-4 py-2 hover:bg-indigo-700 transition"
              >
                + Create First Client
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              You have not been assigned any clients. Please reach out to the administrator for access.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {clients.map((client) => (
            <li
              key={client._id}
              className="bg-white rounded-lg shadow-sm px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {client.photo ? (
                  <img
                    src={client.photo}
                    alt={client.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-semibold flex-shrink-0">
                    {client.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{client.name}</p>
                  {client.notes && (
                    <p className="text-xs text-slate-500 truncate">{client.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                <Link
                  to={`/clients/${client._id}`}
                  className="text-sm text-indigo-600 hover:underline whitespace-nowrap px-2 py-1 rounded hover:bg-indigo-50 transition"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(client._id, client.name)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition whitespace-nowrap px-2 py-1 rounded hover:bg-red-50"
                  title="Delete client (admin only)"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteConfirm.clientName}"? This will also delete all associated entries. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </AppLayout>
  );
}

export default ClientsPage;
