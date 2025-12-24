import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, authHeaders } from "../api";
import AppLayout from "../components/AppLayout";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import ConfirmDialog from "../components/ConfirmDialog";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

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
  // Cards assigned to client
  const [cards, setCards] = useState([]);
  // Separate loading states for client and entries
  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  // Error message state
  const [error, setError] = useState("");

  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    entryId: null,
    entryDescription: "",
  });

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
        if (isAuthError(err)) {
          navigate("/");
          return;
        }
        setError(getErrorMessage(err, "Failed to load client information."));
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
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to load entries."));
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
   * Fetch cards assigned to the client
   */
  const fetchCards = async () => {
    try {
      setLoadingCards(true);
      setError("");

      const res = await api.get(`/api/cards/client/${id}`, {
        headers: authHeaders(),
      });

      setCards(res.data);
    } catch (err) {
      console.error("Fetch cards error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      // Don't show error for cards, just log it
    } finally {
      setLoadingCards(false);
    }
  };

  // Fetch cards when client ID changes
  useEffect(() => {
    fetchCards();
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
   * Remove a specific filter
   */
  const handleRemoveFilter = (filterType) => {
    if (filterType === "category") {
      setCategory("");
    } else if (filterType === "search") {
      setSearch("");
    } else if (filterType === "startDate") {
      setStartDate("");
    } else if (filterType === "endDate") {
      setEndDate("");
    }
    // Note: We'll call fetchEntries after state updates via useEffect
  };

  /**
   * Apply category filter via quick button
   */
  const handleCategoryFilter = (cat) => {
    setCategory(cat === category ? "" : cat);
  };

  // Refetch entries when filters change (after state updates)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, startDate, endDate]);

  /**
   * Format ISO date string to localized date/time string
   * @param {string} iso - ISO date string
   * @returns {string} Formatted date/time string
   */
  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    // Use local date components to avoid timezone issues
    // This ensures the date displayed matches the actual date intended
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const localDate = new Date(year, month, day, hours, minutes);
    return localDate.toLocaleString();
  };

  /**
   * Format date for display in filter chip
   */
  const formatDateForChip = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    // Use local date components to avoid timezone issues
    // This ensures the date displayed matches the actual date intended
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const localDate = new Date(year, month, day);
    return localDate.toLocaleDateString();
  };

  /**
   * Format date for meal card header (e.g., "Monday, January 15, 2024")
   * Accepts either a date string (YYYY-MM-DD) or an ISO timestamp
   */
  const formatDateForMealCard = (dateString) => {
    if (!dateString) return "";
    let d;
    // If dateString is in YYYY-MM-DD format, parse it directly to avoid UTC interpretation
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      d = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      // For ISO timestamps, extract local date components to avoid timezone issues
      const tempDate = new Date(dateString);
      const year = tempDate.getFullYear();
      const month = tempDate.getMonth();
      const day = tempDate.getDate();
      d = new Date(year, month, day);
    }
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };


  /**
   * Get unique dates from meal entries and group by mealType
   * Snacks can have multiple entries, so it's stored as an array
   */
  const getUniqueMealDates = (mealEntries) => {
    const dateMap = new Map();
    
    mealEntries.forEach(entry => {
      if (entry.createdAt) {
        const date = new Date(entry.createdAt);
        // Use local date components to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            breakfast: null,
            lunch: null,
            dinner: null,
            snacks: [] // Array for multiple snack entries
          });
        }
        
        // Group by mealType
        if (entry.mealType) {
          if (entry.mealType === "snacks") {
            // Add snack entry to array
            dateMap.get(dateKey).snacks.push(entry);
          } else if (dateMap.get(dateKey)[entry.mealType] === null) {
            // Single entry for breakfast, lunch, dinner
            dateMap.get(dateKey)[entry.mealType] = entry;
          }
        }
      }
    });

    // Sort dates (newest first)
    // Parse YYYY-MM-DD strings directly to avoid UTC interpretation issues
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      const [yearA, monthA, dayA] = a.split('-').map(Number);
      const [yearB, monthB, dayB] = b.split('-').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateB - dateA;
    });

    return sortedDates.map(dateKey => ({
      date: dateKey,
      meals: dateMap.get(dateKey)
    }));
  };

  // Check if any filters are active
  const hasActiveFilters = category || search || startDate || endDate;

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
      fetchEntries();
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

  return (
    <AppLayout
      title={client?.name || "Client details"}
      subtitle="Daily documentation"
    >
      {error && <Alert type="error">{error}</Alert>}

      {/* Client info card */}
      <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 flex gap-3 sm:gap-4 items-center mb-4 sm:mb-6">
        {loadingClient ? (
          <Loader text="Loading client..." />
        ) : client ? (
          <>
            {client.photo ? (
              <img
                src={client.photo}
                alt={client.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-semibold flex-shrink-0">
                {client.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
            )}
            <div className="flex-1 min-w-0">
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

      {/* Action Buttons Card */}
      {client && (
        <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/clients/${id}/new-entry`}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-3 py-2 hover:bg-indigo-700 transition"
            >
              + New Entry
            </Link>
          </div>
        </section>
      )}

      {/* Assigned Cards */}
      {client && (
        <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Assigned Cards
            </h3>
          </div>
          {loadingCards ? (
            <p className="text-sm text-slate-500">Loading cards...</p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-slate-500">No cards assigned to this client.</p>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => (
                <Link
                  key={card._id}
                  to={`/clients/${id}/cards/${card._id}`}
                  className="block border border-slate-200 rounded-md px-3 py-2 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {card.title}
                    </span>
                    <span className="text-xs text-indigo-600 hover:text-indigo-700">
                      Open →
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {card.fieldTitles.length} fields
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quick Category Filters */}
      <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600 mr-1 sm:mr-2 w-full sm:w-auto">
            Quick filters:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryFilter(cat)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition ${
                category === cat
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600 mr-1 sm:mr-2 w-full sm:w-auto">
              Active filters:
            </span>
            {category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                Category: {category.charAt(0).toUpperCase() + category.slice(1)}
                <button
                  type="button"
                  onClick={() => handleRemoveFilter("category")}
                  className="hover:bg-indigo-200 rounded-full p-0.5 transition"
                  aria-label="Remove category filter"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                Search: "{search}"
                <button
                  type="button"
                  onClick={() => handleRemoveFilter("search")}
                  className="hover:bg-indigo-200 rounded-full p-0.5 transition"
                  aria-label="Remove search filter"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            {startDate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                From: {formatDateForChip(startDate)}
                <button
                  type="button"
                  onClick={() => handleRemoveFilter("startDate")}
                  className="hover:bg-indigo-200 rounded-full p-0.5 transition"
                  aria-label="Remove start date filter"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            {endDate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                To: {formatDateForChip(endDate)}
                <button
                  type="button"
                  onClick={() => handleRemoveFilter("endDate")}
                  className="hover:bg-indigo-200 rounded-full p-0.5 transition"
                  aria-label="Remove end date filter"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearFilters}
              className="ml-auto px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300 transition"
            >
              Clear all
            </button>
          </div>
        </section>
      )}

      {/* Advanced Filters Form */}
      <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Advanced Filters
        </h3>
        <form
          onSubmit={handleApplyFilters}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end"
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

          <div className="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end">
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

      {/* Entries by category */}
      {loadingEntries ? (
        <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <Loader text="Loading entries..." />
        </section>
      ) : (
        (() => {
          // Group entries by category
          const entriesByCategory = entries.reduce((acc, entry) => {
            const cat = entry.category || "uncategorized";
            if (!acc[cat]) {
              acc[cat] = [];
            }
            acc[cat].push(entry);
            return acc;
          }, {});

          // Get categories in a consistent order
          const categoryOrder = [...CATEGORIES, "uncategorized"];
          const sortedCategories = Object.keys(entriesByCategory).sort((a, b) => {
            const indexA = categoryOrder.indexOf(a);
            const indexB = categoryOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });

          // Separate meal entries for special handling
          const mealEntries = entriesByCategory["meals"] || [];
          const otherCategories = sortedCategories.filter(cat => cat !== "meals");

          // Process meal entries by date
          const mealDates = getUniqueMealDates(mealEntries);
          
          // Get entries to display - always show the last 3 meals
          const displayedMealDates = mealDates.slice(0, 3);

          // Check if meals category is enabled for this client
          const mealsEnabled = client?.enabledCategories?.includes("meals") ?? true;

          return (
            <div className="space-y-4 sm:space-y-6">
              {/* Meals card - special expandable card - always show if meals is enabled */}
              {mealsEnabled && (
                <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-800 capitalize">
                      Meals
                    </h2>
                    <Link
                      to={`/clients/${id}/meals`}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 text-white text-xs px-3 py-2 hover:bg-emerald-700 transition"
                    >
                      + Meals
                    </Link>
                  </div>

                  {displayedMealDates.length === 0 ? (
                    <p className="text-sm text-slate-500">No meal entries found.</p>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {displayedMealDates.map((dateGroup) => {
                          const entryDate = dateGroup.date ? formatDateForMealCard(dateGroup.date) : "";
                          const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];

                          return (
                            <div key={dateGroup.date} className="border border-slate-200 rounded-md p-3 sm:p-4">
                              <h3 className="text-sm font-medium text-slate-700 mb-3">
                                {entryDate || "Meal Entry"}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {mealTypes.filter(type => type !== "snacks").map((mealType) => {
                                  const entry = dateGroup.meals[mealType];
                                  
                                  // Get color classes based on meal type
                                  const getColorClasses = (type) => {
                                    switch(type) {
                                      case "breakfast":
                                        return "border-l-2 border-orange-300 bg-orange-50";
                                      case "lunch":
                                        return "border-l-2 border-green-300 bg-green-50";
                                      case "dinner":
                                        return "border-l-2 border-indigo-300 bg-indigo-50";
                                      default:
                                        return "border-l-2 border-slate-300 bg-slate-50";
                                    }
                                  };
                                  
                                  return (
                                    <div
                                      key={mealType}
                                      className={`${getColorClasses(mealType)} pl-3 py-2 rounded`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-slate-600 capitalize">
                                          {mealType}
                                        </p>
                                        {entry && (
                                          <div className="flex items-center gap-2">
                                            <Link
                                              to={`/clients/${id}/meals?date=${dateGroup.date}`}
                                              className="text-indigo-600 hover:text-indigo-700 text-xs font-medium transition"
                                              title="Update entry"
                                            >
                                              Update
                                            </Link>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteClick(entry._id, entry.description)}
                                              className="text-red-600 hover:text-red-700 text-xs font-medium transition"
                                              title="Delete entry"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-sm text-slate-900">
                                        {entry?.description || <span className="text-slate-400 italic">Not reported</span>}
                                      </p>
                                    </div>
                                  );
                                })}
                                
                                {/* Snacks section - display multiple entries */}
                                <div className="border-l-2 border-slate-300 bg-slate-50 pl-3 py-2 rounded sm:col-span-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-medium text-slate-600 capitalize">
                                      Snacks
                                    </p>
                                    <Link
                                      to={`/clients/${id}/meals?date=${dateGroup.date}`}
                                      className="text-indigo-600 hover:text-indigo-700 text-xs font-medium transition"
                                      title="Update snacks"
                                    >
                                      Update
                                    </Link>
                                  </div>
                                  {dateGroup.meals.snacks && dateGroup.meals.snacks.length > 0 ? (
                                    <div className="space-y-2">
                                      {dateGroup.meals.snacks.map((snackEntry, snackIndex) => (
                                        <div key={snackEntry._id || snackIndex} className="flex items-start justify-between gap-2">
                                          <p className="text-sm text-slate-900 flex-1">
                                            {snackEntry.description}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteClick(snackEntry._id, snackEntry.description)}
                                            className="text-red-600 hover:text-red-700 text-xs font-medium transition flex-shrink-0"
                                            title="Delete snack"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">Not reported</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-center">
                        <Link
                          to={`/clients/${id}/meals/history`}
                          className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-3 py-2 hover:bg-indigo-700 transition"
                        >
                          Load More
                        </Link>
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* Other categories */}
              {otherCategories.length > 0 ? (
                otherCategories.map((categoryName) => (
                  <section
                    key={categoryName}
                    className="bg-white rounded-lg shadow-sm p-3 sm:p-4"
                  >
                    <h2 className="text-sm font-semibold text-slate-800 mb-3 capitalize">
                      {categoryName}
                    </h2>
                    {/* Standard rendering for other categories */}
                    <ul className="space-y-3">
                      {entriesByCategory[categoryName].map((entry) => (
                        <li
                          key={entry._id}
                          className="relative border border-slate-200 rounded-md px-3 sm:px-4 py-2 sm:py-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-900 mt-1 break-words">
                                {entry.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                              <p className="text-xs text-slate-400 whitespace-nowrap">
                                {entry.createdAt && formatDateTime(entry.createdAt)}
                              </p>
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
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              ) : entries.length === 0 && !mealsEnabled ? (
                <section className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                  <p className="text-sm text-slate-500">
                    No entries found for this client.
                  </p>
                </section>
              ) : null}
            </div>
          );
        })()
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Entry"
        message={`Are you sure you want to delete this entry? This action cannot be undone.\n\n"${deleteConfirm.entryDescription}"`}
        confirmText="Delete Entry"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </AppLayout>
  );
}

export default ClientDetailPage;
