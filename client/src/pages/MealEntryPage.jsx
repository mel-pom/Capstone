import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, authHeaders } from "../api";
import AppLayout from "../components/AppLayout";
import Alert from "../components/Alert";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

function MealEntryPage() {
  const { id } = useParams(); // clientId
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [clientName, setClientName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingEntryId, setExistingEntryId] = useState(null);

  const [meals, setMeals] = useState({
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: ""
  });

  // Date state - default to today or date from URL query parameter
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      return dateParam; // Use date from URL if provided
    }
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  // Sync selectedDate with URL query parameter
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam);
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

  useEffect(() => {
    const fetchClientAndTodayMeal = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch client info
        const clientRes = await api.get(`/api/clients/${id}`, {
          headers: authHeaders()
        });
        setClientName(clientRes.data?.name || "");

        // Fetch meal entry for selected date if it exists
        const { startDate, endDate } = getDateRange(selectedDate);
        const entriesRes = await api.get(`/api/entries/client/${id}`, {
          headers: authHeaders(),
          params: {
            category: "meals",
            startDate,
            endDate
          }
        });

        // If there's a meal entry for the selected date, load it
        if (entriesRes.data && entriesRes.data.length > 0) {
          const dateEntry = entriesRes.data[0]; // Get the most recent one (sorted by createdAt desc)
          setExistingEntryId(dateEntry._id);
          const parsedMeals = parseMealDescription(dateEntry.description);
          setMeals(parsedMeals);
        } else {
          // Reset if no entry found for selected date
          setExistingEntryId(null);
          setMeals({
            breakfast: "",
            lunch: "",
            dinner: "",
            snacks: ""
          });
        }
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

    fetchClientAndTodayMeal();
  }, [id, navigate, selectedDate]);

  const handleChange = (field) => (e) => {
    setMeals((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const buildMealDescription = () => {
    const lines = [
      `Breakfast: ${meals.breakfast?.trim() || "—"}`,
      `Lunch: ${meals.lunch?.trim() || "—"}`,
      `Dinner: ${meals.dinner?.trim() || "—"}`,
      `Snacks: ${meals.snacks?.trim() || "—"}`
    ];
    return lines.join("\n");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // require at least one field to be filled
    const hasAny =
      meals.breakfast.trim() ||
      meals.lunch.trim() ||
      meals.dinner.trim() ||
      meals.snacks.trim();

    if (!hasAny) {
      setError("Please enter at least one meal item (breakfast, lunch, dinner, or snacks).");
      return;
    }

    try {
      setSubmitting(true);

      const description = buildMealDescription();

      // If editing existing entry, use PUT; otherwise use POST
      // Note: Backend will also check for existing entries on the same date and update them
      if (existingEntryId) {
        await api.put(
          `/api/entries/${existingEntryId}`,
          {
            description
          },
          { headers: authHeaders() }
        );
      } else {
        const response = await api.post(
          "/api/entries",
          {
            clientId: id,
            category: "meals",
            description,
            date: selectedDate // Include the selected date
          },
          { headers: authHeaders() }
        );
        // If backend updated an existing entry, we'll get the updated entry back
        // The entry will have the correct date set in createdAt
      }

      navigate(`/clients/${id}`);
    } catch (err) {
      console.error("Save meal entry error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to save meal entry. Please try again."));
    } finally {
      setSubmitting(false);
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
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">
                {existingEntryId ? "Edit meal entry" : "Enter meal details"}
              </h2>
              {existingEntryId && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  Editing existing entry
                </span>
              )}
            </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
            </div>
            <MealField
              label="Breakfast"
              value={meals.breakfast}
              onChange={handleChange("breakfast")}
              placeholder="e.g., oatmeal + banana"
            />
            <MealField
              label="Lunch"
              value={meals.lunch}
              onChange={handleChange("lunch")}
              placeholder="e.g., chicken wrap + apple"
            />
            <MealField
              label="Dinner"
              value={meals.dinner}
              onChange={handleChange("dinner")}
              placeholder="e.g., pasta + salad"
            />
            <MealField
              label="Snacks"
              value={meals.snacks}
              onChange={handleChange("snacks")}
              placeholder="e.g., yogurt, crackers"
            />

            <div className="flex justify-end gap-2 pt-2">
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
                {submitting ? "Saving..." : existingEntryId ? "Update Meal Entry" : "Save Meal Entry"}
              </button>
            </div>
          </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function MealField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <textarea
        rows={2}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

export default MealEntryPage;
