import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, authHeaders } from "../api";
import AppLayout from "../components/AppLayout";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

// Available entry categories
const CATEGORIES = ["meals", "behavior", "outing", "medical", "notes"];

/**
 * ClientDetailPage component
 * Displays client information and their daily documentation entries with filtering
 */
function ClientDetailPage() {
  // Get client ID from URL parameters
  const { id } = useParams();
  const navigate = useNavigate();

  // Client data state
  const [client, setClient] = useState(null);
  // Entries list state
  const [entries, setEntries] = useState([]);
  // Separate loading states for client and entries
  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  // Error message state
  const [error, setError] = useState("");

  // Filter states
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  // Fetch client info
  useEffect(() => {
    /**
     * Fetch client information by ID
     */
    const fetchClient = async () => {
      try {
        setLoadingClient(true);
        setError("");

        const res = await api.get(`/api/clients/${id}`, {
          headers: authHeaders(),
        });

        setClient(res.data);
      } catch (err) {
        console.error("Fetch client error:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/");
        } else if (err.response?.status === 404) {
          setError("This client could not be found.");
        } else {
          setError("Failed to load client info.");
        }
      } finally {
        setLoadingClient(false);
      }
    };

    fetchClient();
  }, [id, navigate]);

  /**
   * Fetch entries for the client with optional filters
   */
  const fetchEntries = async () => {
    try {
      setLoadingEntries(true);
      setError("");

      // Build query parameters object from filter states
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Get entries with filters applied
      const res = await api.get(`/api/entries/client/${id}`, {
        headers: authHeaders(),
        params,
      });

      setEntries(res.data);
    } catch (err) {
      console.error("Fetch entries error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/");
      } else {
        setError("Failed to load entries.");
      }
    } finally {
      setLoadingEntries(false);
    }
  };

  // Initial load of entries when component mounts or client ID changes
  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Handle filter form submission
   * Applies current filter values and fetches filtered entries
   */
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchEntries();
  };

  /**
   * Clear all filters and reload entries
   */
  const handleClearFilters = () => {
    setCategory("");
    setSearch("");
    setStartDate("");
    setEndDate("");
    fetchEntries();
  };

  /**
   * Format ISO date string to localized date/time string
   * @param {string} iso - ISO date string
   * @returns {string} Formatted date/time string
   */
  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <AppLayout
      title={client?.name || "Client details"}
      subtitle="Daily documentation timeline and filters."
      actions={
        client && (
          <Link
            to={`/clients/${id}/new-entry`}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-3 py-2 hover:bg-indigo-700 transition"
          >
            + New Entry
          </Link>
        )
      }
    >
      {error && <Alert type="error">{error}</Alert>}

      {/* Client info card */}
      <section className="bg-white rounded-lg shadow-sm p-4 flex gap-4 items-center mb-6">
        {loadingClient ? (
          <Loader text="Loading client..." />
        ) : client ? (
          <>
            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-semibold">
              {client.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">
                {client.name}
              </h2>
              {client.notes && (
                <p className="text-sm text-slate-600 mt-1">{client.notes}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Enabled categories:{" "}
                {(client.enabledCategories || []).join(", ")}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Client not found.</p>
        )}
      </section>

      {/* Filters */}
      <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <form
          onSubmit={handleApplyFilters}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. tantrum, medication"
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              Apply
            </button>
          </div>
        </form>
      </section>

      {/* Entries timeline */}
      <section className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Entries</h2>

        {loadingEntries ? (
          <Loader text="Loading entries..." />
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-500">
            No entries found for this client.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry._id}
                className="relative border border-slate-200 rounded-md px-4 py-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {entry.category}
                    </p>
                    <p className="text-sm text-slate-900 mt-1">
                      {entry.description}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {entry.createdAt && formatDateTime(entry.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}

export default ClientDetailPage;
