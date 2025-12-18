import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, authHeaders } from "../api";
import AppLayout from "../components/AppLayout";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import ConfirmDialog from "../components/ConfirmDialog";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

// Meal categories for filtering
const MEAL_CATEGORIES = ["breakfast", "lunch", "dinner", "snacks"];

/**
 * MealHistoryPage component
 * Displays all meal entries with filtering and sorting options
 */
function MealHistoryPage() {
  const { id } = useParams(); // clientId
  const navigate = useNavigate();

  const [clientName, setClientName] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [selectedMealCategory, setSelectedMealCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sort state
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" or "oldest"

  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    entryId: null,
    entryDescription: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  /**
   * Fetch client info and all meal entries
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch client info
        const clientRes = await api.get(`/api/clients/${id}`, {
          headers: authHeaders()
        });
        setClientName(clientRes.data?.name || "");

        // Fetch all meal entries
        await fetchMealEntries();
      } catch (err) {
        console.error("Fetch error:", err);
        if (isAuthError(err)) {
          navigate("/");
          return;
        }
        setError(getErrorMessage(err, "Failed to load data."));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  /**
   * Fetch meal entries with current filters
   */
  const fetchMealEntries = async () => {
    try {
      const params = {
        category: "meals"
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get(`/api/entries/client/${id}`, {
        headers: authHeaders(),
        params
      });

      // Sort entries
      let sortedEntries = [...res.data];
      if (sortOrder === "newest") {
        sortedEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        sortedEntries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      setEntries(sortedEntries);
    } catch (err) {
      console.error("Fetch entries error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to load meal entries."));
    }
  };

  // Refetch when filters or sort order changes
  useEffect(() => {
    fetchMealEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, sortOrder]);

  /**
   * Format date for meal card header (e.g., "Monday, January 15, 2024")
   * Accepts either a date string (YYYY-MM-DD) or an ISO timestamp
   */
  const formatDateForMealCard = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    // Use local date components to avoid timezone issues
    // This ensures the date displayed matches the actual date intended
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const localDate = new Date(year, month, day);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return localDate.toLocaleDateString('en-US', options);
  };

  /**
   * Parse meal description to extract breakfast, lunch, dinner, snacks
   */
  const parseMealDescription = (description) => {
    const parsed = {
      breakfast: "",
      lunch: "",
      dinner: "",
      snacks: ""
    };

    if (!description) return parsed;

    const lines = description.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('Breakfast:')) {
        parsed.breakfast = trimmed.replace(/^Breakfast:\s*/, '').replace(/^—$/, '');
      } else if (trimmed.startsWith('Lunch:')) {
        parsed.lunch = trimmed.replace(/^Lunch:\s*/, '').replace(/^—$/, '');
      } else if (trimmed.startsWith('Dinner:')) {
        parsed.dinner = trimmed.replace(/^Dinner:\s*/, '').replace(/^—$/, '');
      } else if (trimmed.startsWith('Snacks:')) {
        parsed.snacks = trimmed.replace(/^Snacks:\s*/, '').replace(/^—$/, '');
      }
    });

    return parsed;
  };

  /**
   * Check if entry matches selected meal category filter
   */
  const matchesMealCategory = (entry) => {
    if (!selectedMealCategory) return true;
    const parsed = parseMealDescription(entry.description);
    return parsed[selectedMealCategory] && parsed[selectedMealCategory].trim() !== "";
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSelectedMealCategory("");
    setStartDate("");
    setEndDate("");
  };

  /**
   * Handle delete entry confirmation
   */
  const handleDeleteClick = (entryId, entryDescription) => {
    setDeleteConfirm({
      isOpen: true,
      entryId,
      entryDescription: entryDescription.substring(0, 50) + (entryDescription.length > 50 ? "..." : ""),
    });
  };

  /**
   * Handle confirmed entry deletion
   */
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.entryId) return;

    try {
      setError("");
      await api.delete(`/api/entries/${deleteConfirm.entryId}`, {
        headers: authHeaders(),
      });

      // Close dialog and refresh entries
      setDeleteConfirm({ isOpen: false, entryId: null, entryDescription: "" });
      fetchMealEntries();
    } catch (err) {
      console.error("Delete entry error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to delete entry. Please try again."));
      setDeleteConfirm({ isOpen: false, entryId: null, entryDescription: "" });
    }
  };

  /**
   * Handle delete cancellation
   */
  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, entryId: null, entryDescription: "" });
  };

  // Filter entries by meal category
  const filteredEntries = entries.filter(matchesMealCategory);

  return (
    <AppLayout
      title="Meal History"
      subtitle={clientName ? `Meal entries for ${clientName}` : ""}
      actions={
        <Link
          to={`/clients/${id}`}
          className="text-xs text-indigo-600 hover:underline"
        >
          Back to client
        </Link>
      }
    >
      <div className="max-w-5xl">
        {error && <Alert type="error">{error}</Alert>}

        {/* Filters and Sort Section */}
        <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            Filters & Sort
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Meal Category
              </label>
              <select
                value={selectedMealCategory}
                onChange={(e) => setSelectedMealCategory(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Meals</option>
                {MEAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Start Date
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
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {(selectedMealCategory || startDate || endDate) && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* Meal Entries */}
        {loading ? (
          <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <Loader text="Loading meal entries..." />
          </section>
        ) : filteredEntries.length === 0 ? (
          <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-sm text-slate-500">
              No meal entries found{selectedMealCategory || startDate || endDate ? " matching your filters" : ""}.
            </p>
          </section>
        ) : (
          <section className="space-y-4 sm:space-y-6">
            {filteredEntries.map((entry) => {
              const parsedMeals = parseMealDescription(entry.description);
              // Extract date in local timezone to avoid timezone conversion issues
              let entryDate = "";
              if (entry.createdAt) {
                const date = new Date(entry.createdAt);
                // Use local date components to ensure accurate date display
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
                entryDate = formatDateForMealCard(dateKey);
              }

              return (
                <div
                  key={entry._id}
                  className="bg-white rounded-lg shadow-sm p-3 sm:p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-700">
                        {entryDate || "Meal Entry"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(entry._id, entry.description)}
                        className="text-red-600 hover:text-red-700 text-xs font-medium transition whitespace-nowrap"
                        title="Delete entry"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="border-l-2 border-orange-300 pl-3 py-1">
                      <p className="text-xs font-medium text-slate-600 mb-0.5">Breakfast</p>
                      <p className="text-sm text-slate-900">
                        {parsedMeals.breakfast || <span className="text-slate-400 italic">Not reported</span>}
                      </p>
                    </div>
                    <div className="border-l-2 border-green-300 pl-3 py-1">
                      <p className="text-xs font-medium text-slate-600 mb-0.5">Lunch</p>
                      <p className="text-sm text-slate-900">
                        {parsedMeals.lunch || <span className="text-slate-400 italic">Not reported</span>}
                      </p>
                    </div>
                    <div className="border-l-2 border-indigo-300 pl-3 py-1">
                      <p className="text-xs font-medium text-slate-600 mb-0.5">Dinner</p>
                      <p className="text-sm text-slate-900">
                        {parsedMeals.dinner || <span className="text-slate-400 italic">Not reported</span>}
                      </p>
                    </div>
                    <div className="border-l-2 border-slate-300 pl-3 py-1">
                      <p className="text-xs font-medium text-slate-600 mb-0.5">Snacks</p>
                      <p className="text-sm text-slate-900">
                        {parsedMeals.snacks || <span className="text-slate-400 italic">Not reported</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Delete Entry"
          message={`Are you sure you want to delete this meal entry? This action cannot be undone.\n\n"${deleteConfirm.entryDescription}"`}
          confirmText="Delete Entry"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </AppLayout>
  );
}

export default MealHistoryPage;
