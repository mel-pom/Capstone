import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchClients = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClients(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load clients");
      }
    };

    fetchClients();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Clients
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
            className="text-sm text-slate-600 hover:text-red-600"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-100 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {clients.length === 0 ? (
          <p className="text-slate-600 text-sm">
            No clients yet. You can create clients via the API or admin UI later.
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
      </main>
    </div>
  );
}

export default ClientsPage;
