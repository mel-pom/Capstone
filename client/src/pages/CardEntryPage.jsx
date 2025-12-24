import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, authHeaders, isAdmin } from "../api";
import AppLayout from "../components/AppLayout";
import Alert from "../components/Alert";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

function CardEntryPage() {
  const { cardId, clientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [card, setCard] = useState(null);
  const [clientName, setClientName] = useState("");
  const [entries, setEntries] = useState({});
  const [fieldValues, setFieldValues] = useState({});
  const [eventDates, setEventDates] = useState({});
  const [eventTimes, setEventTimes] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const lastLoadedDateRef = useRef(null);

  // Date state - default to today or date from URL query parameter
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      return dateParam;
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  // Sync selectedDate with URL query parameter
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
    } else {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setSelectedDate(todayStr);
    }
  }, [searchParams]);

  useEffect(() => {
    // Only fetch if the date has actually changed
    if (lastLoadedDateRef.current === selectedDate && card && clientName) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch card info (only once, not on every date change)
        if (!card) {
          const cardRes = await api.get(`/api/cards/${cardId}`, {
            headers: authHeaders()
          });
          setCard(cardRes.data);
        }

        // Fetch client info (only once, not on every date change)
        if (!clientName) {
          const clientRes = await api.get(`/api/clients/${clientId}`, {
            headers: authHeaders()
          });
          setClientName(clientRes.data?.name || "");
        }

        // Fetch card entries for selected date
        const entriesRes = await api.get(`/api/card-entries/card/${cardId}/client/${clientId}`, {
          headers: authHeaders(),
          params: {
            date: selectedDate
          }
        });

        // Initialize entries and field values
        const entriesMap = {};
        const valuesMap = {};
        const datesMap = {};
        const timesMap = {};

        if (entriesRes.data && entriesRes.data.length > 0) {
          entriesRes.data.forEach(entry => {
            entriesMap[entry.fieldIndex] = entry;
            valuesMap[entry.fieldIndex] = entry.value || "";
            if (entry.fieldIndex === 10) {
              // For field 10, load eventDate and eventTime
              if (entry.eventDate) {
                const date = new Date(entry.eventDate);
                datesMap[10] = date.toISOString().split('T')[0];
              }
              if (entry.eventTime) {
                timesMap[10] = entry.eventTime;
              }
            }
          });
        }

        setEntries(entriesMap);
        setFieldValues(valuesMap);
        setEventDates(datesMap);
        setEventTimes(timesMap);

        // Mark this date as loaded
        lastLoadedDateRef.current = selectedDate;
      } catch (err) {
        console.error("Fetch data error:", err);
        if (isAuthError(err)) {
          navigate("/");
          return;
        }
        setError(getErrorMessage(err, "Failed to load card information."));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cardId, clientId, navigate, selectedDate, card, clientName]);

  const handleFieldChange = (fieldIndex) => (e) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldIndex]: e.target.value
    }));
  };

  const handleEventDateChange = (value) => {
    setEventDates((prev) => ({
      ...prev,
      [10]: value
    }));
  };

  const handleEventTimeChange = (value) => {
    setEventTimes((prev) => ({
      ...prev,
      [10]: value
    }));
  };

  const handleSaveField = async (fieldIndex) => {
    // For field 10, value is optional
    const value = fieldValues[fieldIndex]?.trim() || "";
    
    if (fieldIndex !== 10) {
      // Don't save if empty for fields 0-9
      if (!value) {
        setError(`Please enter a value for field ${fieldIndex + 1}.`);
        return;
      }
    }

    const entry = entries[fieldIndex];
    
    // Check if field is locked and user is not admin
    if (entry && entry.isLocked && !isAdmin()) {
      setError("This field is locked and can only be edited by an administrator.");
      return;
    }

    try {
      setSubmitting(prev => ({ ...prev, [fieldIndex]: true }));
      setError("");

      // Prepare request data
      const requestData = {
        cardId,
        clientId,
        fieldIndex,
        date: selectedDate
      };

      if (fieldIndex === 10) {
        // For field 10, send eventDate and eventTime
        if (eventDates[10]) {
          requestData.eventDate = eventDates[10];
        }
        if (eventTimes[10]) {
          requestData.eventTime = eventTimes[10];
        }
        if (value) {
          requestData.value = value;
        }
      } else {
        requestData.value = value;
      }

      // Create or update entry
      await api.post(
        "/api/card-entries",
        requestData,
        { headers: authHeaders() }
      );

      // Refetch entries to get updated data
      const entriesRes = await api.get(`/api/card-entries/card/${cardId}/client/${clientId}`, {
        headers: authHeaders(),
        params: {
          date: selectedDate
        }
      });

      const entriesMap = {};
      const valuesMap = {};
      const datesMap = {};
      const timesMap = {};

      if (entriesRes.data && entriesRes.data.length > 0) {
        entriesRes.data.forEach(entry => {
          entriesMap[entry.fieldIndex] = entry;
          valuesMap[entry.fieldIndex] = entry.value || "";
          if (entry.fieldIndex === 10) {
            // For field 10, load eventDate and eventTime
            if (entry.eventDate) {
              const date = new Date(entry.eventDate);
              datesMap[10] = date.toISOString().split('T')[0];
            }
            if (entry.eventTime) {
              timesMap[10] = entry.eventTime;
            }
          }
        });
      }

      setEntries(entriesMap);
      setFieldValues(valuesMap);
      setEventDates(datesMap);
      setEventTimes(timesMap);
    } catch (err) {
      console.error(`Save field ${fieldIndex} error:`, err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, `Failed to save field ${fieldIndex + 1}. Please try again.`));
    } finally {
      setSubmitting(prev => ({ ...prev, [fieldIndex]: false }));
    }
  };

  const handleUnlockField = async (fieldIndex) => {
    const entry = entries[fieldIndex];
    if (!entry) return;

    try {
      setError("");
      await api.put(
        `/api/card-entries/${entry._id}`,
        {
          isLocked: false
        },
        { headers: authHeaders() }
      );

      // Refetch entries
      const entriesRes = await api.get(`/api/card-entries/card/${cardId}/client/${clientId}`, {
        headers: authHeaders(),
        params: {
          date: selectedDate
        }
      });

      const entriesMap = {};
      const valuesMap = {};
      const datesMap = {};
      const timesMap = {};

      if (entriesRes.data && entriesRes.data.length > 0) {
        entriesRes.data.forEach(entry => {
          entriesMap[entry.fieldIndex] = entry;
          valuesMap[entry.fieldIndex] = entry.value || "";
          if (entry.fieldIndex === 10) {
            // For field 10, load eventDate and eventTime
            if (entry.eventDate) {
              const date = new Date(entry.eventDate);
              datesMap[10] = date.toISOString().split('T')[0];
            }
            if (entry.eventTime) {
              timesMap[10] = entry.eventTime;
            }
          }
        });
      }

      setEntries(entriesMap);
      setFieldValues(valuesMap);
      setEventDates(datesMap);
      setEventTimes(timesMap);
    } catch (err) {
      console.error(`Unlock field ${fieldIndex} error:`, err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, `Failed to unlock field ${fieldIndex + 1}. Please try again.`));
    }
  };

  const handleLockField = async (fieldIndex) => {
    const entry = entries[fieldIndex];
    if (!entry) return;

    try {
      setError("");
      await api.put(
        `/api/card-entries/${entry._id}`,
        {
          isLocked: true
        },
        { headers: authHeaders() }
      );

      // Refetch entries
      const entriesRes = await api.get(`/api/card-entries/card/${cardId}/client/${clientId}`, {
        headers: authHeaders(),
        params: {
          date: selectedDate
        }
      });

      const entriesMap = {};
      const valuesMap = {};
      const datesMap = {};
      const timesMap = {};

      if (entriesRes.data && entriesRes.data.length > 0) {
        entriesRes.data.forEach(entry => {
          entriesMap[entry.fieldIndex] = entry;
          valuesMap[entry.fieldIndex] = entry.value || "";
          if (entry.fieldIndex === 10) {
            // For field 10, load eventDate and eventTime
            if (entry.eventDate) {
              const date = new Date(entry.eventDate);
              datesMap[10] = date.toISOString().split('T')[0];
            }
            if (entry.eventTime) {
              timesMap[10] = entry.eventTime;
            }
          }
        });
      }

      setEntries(entriesMap);
      setFieldValues(valuesMap);
      setEventDates(datesMap);
      setEventTimes(timesMap);
    } catch (err) {
      console.error(`Lock field ${fieldIndex} error:`, err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, `Failed to lock field ${fieldIndex + 1}. Please try again.`));
    }
  };

  if (loading) {
    return (
      <AppLayout title="Card Entry" subtitle="Loading...">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!card) {
    return (
      <AppLayout title="Card Entry" subtitle="Card not found">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-slate-500">Card not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={card.title}
      subtitle={clientName ? `Documenting for ${clientName}` : ""}
      actions={
        <button
          type="button"
          onClick={() => navigate(`/clients/${clientId}`)}
          className="text-xs text-indigo-600 hover:underline"
        >
          Back to client
        </button>
      }
    >
      <div className="max-w-2xl">
        {error && <Alert type="error">{error}</Alert>}

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              lastLoadedDateRef.current = null; // Force refetch
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-4">
          {card.fieldTitles.map((fieldTitle, index) => {
            // Only show enabled fields
            const enabledFields = card.enabledFields || Array.from({ length: 11 }, (_, i) => i);
            if (!enabledFields.includes(index)) {
              return null;
            }

            const entry = entries[index];
            const value = fieldValues[index] || "";
            const eventDate = eventDates[index] || "";
            const eventTime = eventTimes[index] || "";
            const isSubmitting = submitting[index] || false;
            const isLocked = entry?.isLocked || false;
            const hasExistingEntry = entry !== undefined;
            const isDateTimeField = index === 10;

            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {fieldTitle}
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasExistingEntry && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Saved
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                        Locked
                      </span>
                    )}
                    {isAdmin() && hasExistingEntry && (
                      <button
                        type="button"
                        onClick={() => isLocked ? handleUnlockField(index) : handleLockField(index)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        {isLocked ? "Unlock" : "Lock"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {isDateTimeField ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Event Date (optional) - Click to open calendar
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => handleEventDateChange(e.target.value)}
                            disabled={isLocked && !isAdmin()}
                            className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              isLocked && !isAdmin() ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "cursor-pointer"
                            }`}
                            title="Click to open calendar and select a date"
                          />
                          {!isLocked || isAdmin() ? (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Click the date field above to open a calendar and select a date
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Event Time (optional)
                        </label>
                        <input
                          type="time"
                          value={eventTime}
                          onChange={(e) => handleEventTimeChange(e.target.value)}
                          disabled={isLocked && !isAdmin()}
                          className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            isLocked && !isAdmin() ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <textarea
                        rows={3}
                        value={value}
                        onChange={handleFieldChange(index)}
                        placeholder={`Enter ${fieldTitle.toLowerCase()}...`}
                        disabled={isLocked && !isAdmin()}
                        className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isLocked && !isAdmin() ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveField(index)}
                      disabled={
                        isSubmitting || 
                        (isLocked && !isAdmin()) ||
                        (!isDateTimeField && !value.trim()) ||
                        (isDateTimeField && !eventDate && !eventTime && !value.trim())
                      }
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Saving..." : hasExistingEntry ? "Update" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

export default CardEntryPage;

