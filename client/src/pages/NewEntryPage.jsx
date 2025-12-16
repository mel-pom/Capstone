import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, authHeaders } from "../api";
import AppLayout from "../components/AppLayout";
import Alert from "../components/Alert";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

// Available entry categories
const CATEGORIES = ["meals", "behavior", "outing", "medical", "notes"];

/**
 * NewEntryPage component
 * Form for creating a new daily documentation entry for a client
 */
function NewEntryPage() {
  // Get client ID from URL parameters
  const { id } = useParams(); // clientId
  const navigate = useNavigate();

  // Form state
  const [clientName, setClientName] = useState("");
  const [category, setCategory] = useState("behavior");
  const [description, setDescription] = useState("");
  // Error and loading states
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  // Fetch client name for header display
  useEffect(() => {
    /**
     * Fetch client name to display in page subtitle
     */
    const fetchClient = async () => {
      try {
        const res = await api.get(`/api/clients/${id}`, {
          headers: authHeaders(),
        });
        setClientName(res.data?.name || "");
      } catch (err) {
        console.error("Fetch client name error:", err);
        if (isAuthError(err)) {
          navigate("/");
        }
      }
    };

    fetchClient();
  }, [id, navigate]);

  /**
   * Handle form submission
   * Creates a new entry and redirects to client detail page on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate description is not empty
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    try {
      setSubmitting(true);

      // Create new entry via API
      await api.post(
        "/api/entries",
        {
          clientId: id,
          category,
          description,
        },
        { headers: authHeaders() }
      );

      // Redirect to client detail page after successful creation
      navigate(`/clients/${id}`);
    } catch (err) {
      console.error("Create entry error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to create entry. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="New Entry"
      subtitle={clientName ? `Documenting for ${clientName}` : ""}
      actions={
        <button
          type="button"
          onClick={() => navigate(`/clients/${id}`)}
          className="text-xs text-indigo-600 hover:underline"
        >
          Back to client
        </button>
      }
    >
      <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 max-w-xl mx-auto">
        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Description / details
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe behaviors, meals, outings, medical notes, or general observations..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate(`/clients/${id}`)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </section>
    </AppLayout>
  );
}

export default NewEntryPage;
