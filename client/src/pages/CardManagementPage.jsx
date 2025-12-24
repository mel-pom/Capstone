import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders, isAdmin } from "../api";
import AppLayout from "../components/AppLayout";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import ConfirmDialog from "../components/ConfirmDialog";
import { getErrorMessage, isAuthError } from "../utils/errorHandler.js";

function CardManagementPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [assigningCard, setAssigningCard] = useState(null);
  
  // Form state
  const [title, setTitle] = useState("Untitled Card");
  const [fieldTitles, setFieldTitles] = useState(
    Array.from({ length: 11 }, (_, i) => `untitled ${i + 1}`)
  );
  const [enabledFields, setEnabledFields] = useState(
    Array.from({ length: 11 }, (_, i) => i)
  );
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    cardId: null,
    cardTitle: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    if (!isAdmin()) {
      navigate("/clients");
      return;
    }

    fetchCards();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/cards", {
        headers: authHeaders(),
      });
      setCards(res.data);
    } catch (err) {
      console.error("Fetch cards error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to load cards."));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get("/api/clients", {
        headers: authHeaders(),
      });
      setClients(res.data);
    } catch (err) {
      console.error("Fetch clients error:", err);
    }
  };

  const handleCreateCard = () => {
    setTitle("Untitled Card");
    setFieldTitles(Array.from({ length: 11 }, (_, i) => `untitled ${i + 1}`));
    setEnabledFields(Array.from({ length: 11 }, (_, i) => i));
    setEditingCard(null);
    setShowCreateForm(true);
  };

  const handleEditCard = (card) => {
    setTitle(card.title);
    // Ensure we have 11 fields
    const titles = [...card.fieldTitles];
    while (titles.length < 11) {
      titles.push(`untitled ${titles.length + 1}`);
    }
    setFieldTitles(titles);
    setEnabledFields(card.enabledFields || Array.from({ length: 11 }, (_, i) => i));
    setEditingCard(card);
    setShowCreateForm(true);
  };

  const handleFieldTitleChange = (index, value) => {
    const newTitles = [...fieldTitles];
    newTitles[index] = value;
    setFieldTitles(newTitles);
  };

  const handleEnabledFieldToggle = (index) => {
    setEnabledFields((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (editingCard) {
        // Update existing card
        await api.put(
          `/api/cards/${editingCard._id}`,
          {
            title: title.trim(),
            fieldTitles: fieldTitles.map((t, index) => t.trim() || `untitled ${index + 1}`),
            enabledFields: enabledFields,
          },
          { headers: authHeaders() }
        );
      } else {
        // Create new card
        await api.post(
          "/api/cards",
          {
            title: title.trim(),
            fieldTitles: fieldTitles.map((t, index) => t.trim() || `untitled ${index + 1}`),
            enabledFields: enabledFields,
          },
          { headers: authHeaders() }
        );
      }

      setShowCreateForm(false);
      setEditingCard(null);
      fetchCards();
    } catch (err) {
      console.error("Save card error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to save card. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignCard = (card) => {
    setAssigningCard(card);
    setSelectedClientIds(card.assignedClients.map(c => c._id || c));
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post(
        `/api/cards/${assigningCard._id}/assign`,
        { clientIds: selectedClientIds },
        { headers: authHeaders() }
      );

      setAssigningCard(null);
      setSelectedClientIds([]);
      fetchCards();
    } catch (err) {
      console.error("Assign card error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to assign card. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (cardId, cardTitle) => {
    setDeleteConfirm({
      isOpen: true,
      cardId,
      cardTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.cardId) return;

    try {
      setError("");
      await api.delete(`/api/cards/${deleteConfirm.cardId}`, {
        headers: authHeaders(),
      });

      setDeleteConfirm({ isOpen: false, cardId: null, cardTitle: "" });
      fetchCards();
    } catch (err) {
      console.error("Delete card error:", err);
      if (isAuthError(err)) {
        navigate("/");
        return;
      }
      setError(getErrorMessage(err, "Failed to delete card. Please try again."));
      setDeleteConfirm({ isOpen: false, cardId: null, cardTitle: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, cardId: null, cardTitle: "" });
  };

  const handleClientToggle = (clientId) => {
    setSelectedClientIds((prev) => {
      if (prev.includes(clientId)) {
        return prev.filter((id) => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  if (loading) {
    return (
      <AppLayout title="Card Management" subtitle="Create and manage custom cards.">
        <Loader text="Loading cards..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Card Management"
      subtitle="Create and manage custom cards for clients."
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
      {error && <Alert type="error">{error}</Alert>}

      {!showCreateForm && !assigningCard && (
        <>
          <div className="mb-4">
            <button
              type="button"
              onClick={handleCreateCard}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-3 py-2 hover:bg-indigo-700 transition"
            >
              + New Card
            </button>
          </div>

          {cards.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-sm text-slate-600 mb-4">
                No cards yet. Create your first card to get started.
              </p>
              <button
                type="button"
                onClick={handleCreateCard}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-4 py-2 hover:bg-indigo-700 transition"
              >
                + Create First Card
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => (
                <div
                  key={card._id}
                  className="bg-white rounded-lg shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {card.title}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCard(card)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignCard(card)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(card._id, card.title)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 mb-2">
                    Fields: {card.fieldTitles.length}
                  </div>
                  {card.assignedClients && card.assignedClients.length > 0 && (
                    <div className="text-xs text-slate-500">
                      Assigned to: {card.assignedClients.map(c => c.name || c).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-2xl">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            {editingCard ? "Edit Card" : "Create New Card"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Card Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Card"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Field Titles (11 fields - last field is date/time)
              </label>
              <div className="space-y-2">
                {fieldTitles.map((fieldTitle, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabledFields.includes(index)}
                      onChange={() => handleEnabledFieldToggle(index)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                    />
                    {index === 10 ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={fieldTitle}
                          onChange={(e) => handleFieldTitleChange(index, e.target.value)}
                          placeholder="Date/Time Field Title"
                          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-500 self-center px-2">
                          (Date/Time)
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={fieldTitle}
                        onChange={(e) => handleFieldTitleChange(index, e.target.value)}
                        placeholder={`untitled ${index + 1}`}
                        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Check the boxes to enable fields that will appear on the card entry page. Field 11 is a special date/time field.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCard(null);
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Saving..." : editingCard ? "Update Card" : "Create Card"}
              </button>
            </div>
          </form>
        </div>
      )}

      {assigningCard && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-2xl">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            Assign Card: {assigningCard.title}
          </h3>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Select Clients
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-md p-3">
                {clients.map((client) => (
                  <label
                    key={client._id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.includes(client._id)}
                      onChange={() => handleClientToggle(client._id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{client.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAssigningCard(null);
                  setSelectedClientIds([]);
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Assigning..." : "Assign Card"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Card"
        message={`Are you sure you want to delete "${deleteConfirm.cardTitle}"? This will also delete all associated entries. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </AppLayout>
  );
}

export default CardManagementPage;

