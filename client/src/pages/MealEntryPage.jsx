import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, authHeaders } from "../api";
import AppLayout from "../components/AppLayout";
import Alert from "../components/Alert";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"];

function MealEntryPage() {
  const { id } = useParams(); // clientId
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [clientName, setClientName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // Track the last date we loaded data for to prevent unnecessary refetches
  const lastLoadedDateRef = useRef(null);

  // Track meals and their entry IDs separately
  // Snacks is an array to allow multiple entries
  const [meals, setMeals] = useState({
    breakfast: { value: "", entryId: null },
    lunch: { value: "", entryId: null },
    dinner: { value: "", entryId: null },
    snacks: [] // Array of { value: "", entryId: null, tempId: string }
  });

  // Track which meal types are being submitted
  const [submitting, setSubmitting] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: {}
  });

  // Track if saving all entries
  const [savingAll, setSavingAll] = useState(false);

  // Track previous entries for each meal type
  const [previousEntries, setPreviousEntries] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });

  // Track which previous entries sections are expanded (default to true so they're visible)
  const [expandedSections, setExpandedSections] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
    snacks: true
  });

  // Date state - default to today or date from URL query parameter
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      return dateParam; // Use date from URL if provided (for updating existing entries)
    }
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format (for new entries)
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  // Sync selectedDate with URL query parameter
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      // Use date from URL if provided (for updating existing entries)
      setSelectedDate(dateParam);
    } else {
      // Always use today's date when no URL param (creating new entry)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setSelectedDate(todayStr);
    }
  }, [searchParams]);

  /**
   * Get date range for a given date (start and end of day in ISO format)
   */
  const getDateRange = (dateString) => {
    const date = new Date(dateString);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      startDate: startOfDay.toISOString().split('T')[0],
      endDate: endOfDay.toISOString().split('T')[0]
    };
  };

  /**
   * Fetch previous entries for all meal types (excluding current date)
   */
  const fetchPreviousEntries = useCallback(async () => {
    try {
      // Parse selected date
      const [year, month, day] = selectedDate.split('-').map(Number);
      const selectedDateObj = new Date(year, month - 1, day);
      const startOfSelectedDate = new Date(selectedDateObj);
      startOfSelectedDate.setHours(0, 0, 0, 0);
      
      // Fetch ALL meal entries (no date filter) and filter client-side
      // This ensures we get all entries regardless of how dates are stored
      const entriesRes = await api.get(`/api/entries/client/${id}`, {
        headers: authHeaders(),
        params: {
          category: "meals"
        }
      });

      // Group entries by mealType and filter out entries from the selected date
      const grouped = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      };

      if (entriesRes.data && entriesRes.data.length > 0) {
        entriesRes.data.forEach(entry => {
          if (entry.mealType && grouped[entry.mealType]) {
            // Include all entries regardless of date - show all previous entries for reference
            grouped[entry.mealType].push(entry);
          }
        });

        // Sort each group by date (newest first) and take last 7 entries
        Object.keys(grouped).forEach(mealType => {
          grouped[mealType].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(a.createdAt);
            const dateB = b.date ? new Date(b.date) : new Date(b.createdAt);
            return dateB - dateA; // Newest first
          });
          grouped[mealType] = grouped[mealType].slice(0, 7); // Keep last 7 entries
        });
      }

      setPreviousEntries(grouped);
    } catch (err) {
      console.error("Fetch previous entries error:", err);
      console.error("Error details:", err.response?.data || err.message);
      // Don't show error to user, just log it
      // Set empty previous entries on error
      setPreviousEntries({
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      });
    }
  }, [id, selectedDate]);

  useEffect(() => {
    // Only fetch if the date has actually changed
    if (lastLoadedDateRef.current === selectedDate && clientName) {
      return;
    }

    const fetchClientAndMeals = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch client info (only once, not on every date change)
        if (!clientName) {
          const clientRes = await api.get(`/api/clients/${id}`, {
            headers: authHeaders()
          });
          setClientName(clientRes.data?.name || "");
        }

        // Fetch all meal entries for selected date
        const { startDate, endDate } = getDateRange(selectedDate);
        const entriesRes = await api.get(`/api/entries/client/${id}`, {
          headers: authHeaders(),
          params: {
            category: "meals",
            startDate,
            endDate
          }
        });

        // Initialize meals state with existing entries
        const updatedMeals = {
          breakfast: { value: "", entryId: null },
          lunch: { value: "", entryId: null },
          dinner: { value: "", entryId: null },
          snacks: [] // Array for multiple snack entries
        };

        // Load existing meal entries by mealType
        if (entriesRes.data && entriesRes.data.length > 0) {
          entriesRes.data.forEach(entry => {
            if (entry.mealType) {
              if (entry.mealType === "snacks") {
                // Add snack entry to array
                updatedMeals.snacks.push({
                  value: entry.description || "",
                  entryId: entry._id,
                  tempId: entry._id // Use entry ID as temp ID for existing entries
                });
              } else if (updatedMeals[entry.mealType]) {
                // Single entry for breakfast, lunch, dinner
                updatedMeals[entry.mealType] = {
                  value: entry.description || "",
                  entryId: entry._id
                };
              }
            }
          });
        }

        setMeals(updatedMeals);

        // Fetch previous entries for all meal types (excluding current date)
        await fetchPreviousEntries();

        // Mark this date as loaded
        lastLoadedDateRef.current = selectedDate;
      } catch (err) {
        console.error("Fetch client/meal error:", err);
        if (isAuthError(err)) {
          navigate("/");
          return;
        }
        setError(getErrorMessage(err, "Failed to load client information."));
      } finally {
        setLoading(false);
      }
    };

    fetchClientAndMeals();
  }, [id, navigate, selectedDate, clientName, fetchPreviousEntries]);

  /**
   * Format date for display in previous entries
   */
  const formatEntryDate = (dateString) => {
    if (!dateString) return "";
    let d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      d = new Date(year, month - 1, day);
    } else {
      const tempDate = new Date(dateString);
      const year = tempDate.getFullYear();
      const month = tempDate.getMonth();
      const day = tempDate.getDate();
      d = new Date(year, month, day);
    }
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  /**
   * Toggle expanded state for previous entries section
   */
  const toggleExpanded = (mealType) => {
    setExpandedSections(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };

  const handleChange = (mealType) => (e) => {
    setMeals((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        value: e.target.value
      }
    }));
  };

  const handleSnackChange = (index) => (e) => {
    setMeals((prev) => ({
      ...prev,
      snacks: prev.snacks.map((snack, i) => 
        i === index ? { ...snack, value: e.target.value } : snack
      )
    }));
  };

  const handleAddSnack = () => {
    setMeals((prev) => ({
      ...prev,
      snacks: [...prev.snacks, { value: "", entryId: null, tempId: `temp-${Date.now()}` }]
    }));
  };

  const handleRemoveSnack = (index) => {
    setMeals((prev) => ({
      ...prev,
      snacks: prev.snacks.filter((_, i) => i !== index)
    }));
  };

  /**
   * Save all meal entries at once
   */
  const handleSaveAll = async () => {
    try {
      setSavingAll(true);
      setError("");

      const promises = [];

      // Save breakfast, lunch, dinner
      for (const mealType of ["breakfast", "lunch", "dinner"]) {
        const meal = meals[mealType];
        const value = meal.value.trim();
        
        if (value) {
          if (meal.entryId) {
            // Update existing entry
            promises.push(
              api.put(
                `/api/entries/${meal.entryId}`,
                {
                  description: value,
                  mealType: mealType
                },
                { headers: authHeaders() }
              )
            );
          } else {
            // Create new entry
            promises.push(
              api.post(
                "/api/entries",
                {
                  clientId: id,
                  category: "meals",
                  description: value,
                  mealType: mealType,
                  date: selectedDate
                },
                { headers: authHeaders() }
              )
            );
          }
        }
      }

      // Save all snacks
      meals.snacks.forEach((snack) => {
        const value = snack.value.trim();
        
        if (value) {
          if (snack.entryId) {
            // Update existing entry
            promises.push(
              api.put(
                `/api/entries/${snack.entryId}`,
                {
                  description: value,
                  mealType: "snacks"
                },
                { headers: authHeaders() }
              )
            );
          } else {
            // Create new entry
            promises.push(
              api.post(
                "/api/entries",
                {
                  clientId: id,
                  category: "meals",
                  description: value,
                  mealType: "snacks",
                  date: selectedDate
                },
                { headers: authHeaders() }
              )
            );
          }
        }
      });

      // Wait for all saves to complete
      if (promises.length > 0) {
        await Promise.all(promises);
      }

      // Navigate back to client detail page after successful save
      navigate(`/clients/${id}`);
    } catch (err) {
      console.error("Save all error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to save entries. Please try again."));
    } finally {
      setSavingAll(false);
    }
  };

  const handleDeleteSnack = async (index) => {
    const snack = meals.snacks[index];
    
    // If it's a new unsaved entry, just remove it from the array
    if (!snack.entryId) {
      handleRemoveSnack(index);
      return;
    }

    try {
      setSubmitting(prev => ({ 
        ...prev, 
        snacks: { ...prev.snacks, [index]: true } 
      }));
      setError("");

      await api.delete(`/api/entries/${snack.entryId}`, {
        headers: authHeaders()
      });

      // Remove from local state first
      handleRemoveSnack(index);

      // Refetch ALL entries to ensure we have the latest state
      const { startDate, endDate } = getDateRange(selectedDate);
      const entriesRes = await api.get(`/api/entries/client/${id}`, {
        headers: authHeaders(),
        params: {
          category: "meals",
          startDate,
          endDate
        }
      });

      // Reload all snack entries from the server to ensure consistency
      const snackEntries = entriesRes.data?.filter(e => e.mealType === "snacks") || [];
      const updatedSnacks = snackEntries.map(entry => ({
        value: entry.description || "",
        entryId: entry._id,
        tempId: entry._id
      }));

      // Update the snacks array with all entries from server
      // But preserve any unsaved entries (those without entryId)
      setMeals(prev => {
        const unsavedSnacks = prev.snacks.filter(s => !s.entryId);
        return {
          ...prev,
          snacks: [...updatedSnacks, ...unsavedSnacks]
        };
      });
    } catch (err) {
      console.error("Delete snack error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to delete snack. Please try again."));
    } finally {
      setSubmitting(prev => ({ 
        ...prev, 
        snacks: { ...prev.snacks, [index]: false } 
      }));
    }
  };

  return (
    <AppLayout
      title="Meal Entry"
      subtitle={clientName ? `Documenting meals for ${clientName}` : ""}
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
      <div className="max-w-2xl">
        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-slate-500">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {MEAL_TYPES.filter(type => type !== "snacks").map((mealType) => {
              const meal = meals[mealType];
              const hasExistingEntry = meal.entryId !== null;

              return (
                <div key={mealType} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800 capitalize">
                      {mealType}
                    </h3>
                    {hasExistingEntry && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Saved
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)} details
                      </label>
                      <textarea
                        rows={3}
                        value={meal.value}
                        onChange={handleChange(mealType)}
                        placeholder={`e.g., ${mealType === "breakfast" ? "oatmeal + banana" : mealType === "lunch" ? "chicken wrap + apple" : "pasta + salad"}`}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Previous entries section - always show if data has been loaded */}
                    <div className="border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(mealType)}
                        className="flex items-center justify-between w-full text-xs font-medium text-slate-600 hover:text-slate-800"
                      >
                        <span>Previous entries ({previousEntries[mealType]?.length || 0})</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${expandedSections[mealType] ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedSections[mealType] && (
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                          {previousEntries[mealType] && previousEntries[mealType].length > 0 ? (
                            previousEntries[mealType].map((entry) => (
                              <div
                                key={entry._id}
                                className="bg-slate-50 rounded-md p-2 text-xs border border-slate-200"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-500 mb-1">
                                      {formatEntryDate(entry.date || entry.createdAt)}
                                    </p>
                                    <p className="text-slate-900 break-words">
                                      {entry.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2">No previous entries</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Snacks section - allows multiple entries */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800 capitalize">
                  Snacks
                </h3>
                <button
                  type="button"
                  onClick={handleAddSnack}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Add Snack
                </button>
              </div>

              {/* Previous snack entries section - always show if data has been loaded */}
              <div className="border-b border-slate-200 pb-3 mb-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded("snacks")}
                  className="flex items-center justify-between w-full text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  <span>Previous snack entries ({previousEntries.snacks?.length || 0})</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedSections.snacks ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.snacks && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {previousEntries.snacks && previousEntries.snacks.length > 0 ? (
                      previousEntries.snacks.map((entry) => (
                        <div
                          key={entry._id}
                          className="bg-slate-50 rounded-md p-2 text-xs border border-slate-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-500 mb-1">
                                {formatEntryDate(entry.date || entry.createdAt)}
                              </p>
                              <p className="text-slate-900 break-words">
                                {entry.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No previous entries</p>
                    )}
                  </div>
                )}
              </div>

              {meals.snacks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-3">No snack entries yet.</p>
                  <button
                    type="button"
                    onClick={handleAddSnack}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700"
                  >
                    Add First Snack
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.snacks.map((snack, index) => {
                    const isSubmitting = submitting.snacks[index] || false;
                    const hasExistingEntry = snack.entryId !== null;

                    return (
                      <div key={snack.tempId || index} className="border border-slate-200 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-600">
                            Snack #{index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {hasExistingEntry && (
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                Saved
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteSnack(index)}
                              disabled={isSubmitting}
                              className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={snack.value}
                            onChange={handleSnackChange(index)}
                            placeholder="e.g., yogurt, crackers, apple slices"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Save All button at the bottom */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-t-2 border-indigo-200">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={savingAll || (!meals.breakfast.value.trim() && !meals.lunch.value.trim() && !meals.dinner.value.trim() && meals.snacks.every(s => !s.value.trim()))}
                  className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingAll ? "Saving All..." : "Save All Entries"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default MealEntryPage;
