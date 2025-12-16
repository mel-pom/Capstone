import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../api";
import AppLayout from "../components/AppLayout";
import Alert from "../components/Alert";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

// Available entry categories
const CATEGORIES = ["meals", "behavior", "outing", "medical", "notes"];

/**
 * NewClientPage component
 * Form for creating a new client (admin only)
 */
function NewClientPage() {
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [enabledCategories, setEnabledCategories] = useState([
    "meals",
    "behavior",
    "outing",
    "medical",
    "notes",
  ]);
  const [notes, setNotes] = useState("");
  // Error and loading states
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  /**
   * Handle category checkbox changes
   */
  const handleCategoryChange = (category) => {
    setEnabledCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((cat) => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  /**
   * Handle photo file upload and convert to base64
   */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPhoto("");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB.");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      setError("");
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle form submission
   * Creates a new client and redirects to clients page on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate name is not empty
    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    // Validate at least one category is selected
    if (enabledCategories.length === 0) {
      setError("Please select at least one enabled category.");
      return;
    }

    try {
      setSubmitting(true);

      // Create new client via API
      await api.post(
        "/api/clients",
        {
          name: name.trim(),
          photo,
          enabledCategories,
          notes: notes.trim(),
        },
        { headers: authHeaders() }
      );

      // Redirect to clients page after successful creation
      navigate("/clients");
    } catch (err) {
      console.error("Create client error:", err);
      if (isAuthError(err)) {
        if (err.response?.status === 403) {
          setError(getErrorMessage(err, "You don't have permission to create clients. Admin access required."));
        } else {
          navigate("/");
          return;
        }
      } else {
        setError(getErrorMessage(err, "Failed to create client. Please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="New Client"
      subtitle="Add a new client to the system."
      actions={
        <button
          type="button"
          onClick={() => navigate("/clients")}
          className="text-xs text-indigo-600 hover:underline"
        >
          Back to clients
        </button>
      }
    >
      <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 max-w-2xl mx-auto">
        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter client name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Profile Photo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {photo && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">Preview:</p>
                <img
                  src={photo}
                  alt="Preview"
                  className="h-24 w-24 rounded-full object-cover border border-slate-200"
                />
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Maximum file size: 2MB. Image will be stored as base64.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Enabled Categories <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabledCategories.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select which entry categories are available for this client.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Notes (optional)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the client..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate("/clients")}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </section>
    </AppLayout>
  );
}

export default NewClientPage;

