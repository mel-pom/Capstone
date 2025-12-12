import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, authHeaders } from "../api";
import AppLayout from "../components/AppLayout";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

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
        // Redirect to login on authentication errors
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/");
        } else {
          setError("Failed to load clients.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [navigate]);

  return (
    <AppLayout
      title="Clients"
      subtitle="Select a client to view their daily documentation."
    >
      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <Loader text="Loading clients..." />
      ) : clients.length === 0 ? (
        <p className="text-sm text-slate-600">
          No clients yet. You can create clients through the admin interface or
          API.
        </p>
      ) : (
        <ul className="space-y-2">
          {clients.map((client) => (
            <li
              key={client._id}
              className="bg-white rounded-lg shadow-sm px-4 py-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-slate-900">{client.name}</p>
                {client.notes && (
                  <p className="text-xs text-slate-500">{client.notes}</p>
                )}
              </div>
              <Link
                to={`/clients/${client._id}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppLayout>
  );
}

export default ClientsPage;
