import express from "express";
import Card from "../models/Card.js";
import CardEntry from "../models/CardEntry.js";
import Client from "../models/Client.js";
import { auth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";
import { isValidObjectId } from "../utils/validateObjectId.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

const router = express.Router();

/**
 * Helper function to check if a user has access to a client
 */
async function hasClientAccess(userId, userRole, clientId) {
  if (userRole === "admin") {
    return true;
  }
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(userId).select("assignedClients");
  if (!user) {
    return false;
  }
  return user.assignedClients.some(
    (assignedId) => assignedId.toString() === clientId.toString()
  );
}

/**
 * POST /api/cards
 * Create a new card (admin only)
 */
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { title, fieldTitles, enabledFields } = req.body;

    // Validate title
    const cardTitle = title?.trim() || "Untitled Card";
    if (cardTitle.length > 100) {
      return res.status(400).json({
        error: "Card title must be less than 100 characters",
      });
    }

    // Validate fieldTitles
    let fields = fieldTitles || [];
    if (!Array.isArray(fields)) {
      return res.status(400).json({
        error: "fieldTitles must be an array",
      });
    }

    // Ensure we have at most 11 fields
    if (fields.length > 11) {
      return res.status(400).json({
        error: "Card cannot have more than 11 fields",
      });
    }

    // Fill missing fields with default titles
    while (fields.length < 11) {
      fields.push(`untitled ${fields.length + 1}`);
    }

    // Validate each field title
    for (let i = 0; i < fields.length; i++) {
      if (typeof fields[i] !== "string") {
        return res.status(400).json({
          error: `Field title at index ${i} must be a string`,
        });
      }
      if (fields[i].trim().length > 100) {
        return res.status(400).json({
          error: `Field title at index ${i} must be less than 100 characters`,
        });
      }
      fields[i] = fields[i].trim() || `untitled ${i + 1}`;
    }

    // Validate enabledFields
    let enabled = enabledFields || Array.from({ length: 10 }, (_, i) => i);
    if (!Array.isArray(enabled)) {
      return res.status(400).json({
        error: "enabledFields must be an array",
      });
    }
    // Ensure all values are valid field indices (0-10)
    enabled = enabled.filter((idx, pos) => 
      typeof idx === "number" && idx >= 0 && idx <= 10 && enabled.indexOf(idx) === pos
    );
    // If no fields enabled, default to all enabled
    if (enabled.length === 0) {
      enabled = Array.from({ length: 11 }, (_, i) => i);
    }

    const card = await Card.create({
      title: cardTitle,
      fieldTitles: fields,
      enabledFields: enabled,
      createdBy: req.user.id,
      assignedClients: []
    });

    res.status(201).json(card);
  } catch (err) {
    console.error("Create card error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to create card");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * GET /api/cards
 * Get all cards (admin only)
 */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    const cards = await Card.find()
      .populate("createdBy", "email")
      .populate("assignedClients", "name")
      .sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    console.error("Get cards error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to fetch cards");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

/**
 * GET /api/cards/:id
 * Get a specific card
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid card ID format" });
    }

    const card = await Card.findById(id)
      .populate("createdBy", "email")
      .populate("assignedClients", "name");

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json(card);
  } catch (err) {
    console.error("Get card error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to fetch card");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

/**
 * PUT /api/cards/:id
 * Update a card (admin only)
 */
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid card ID format" });
    }

    const { title, fieldTitles, enabledFields } = req.body;

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    const updateData = {};

    if (title !== undefined) {
      const cardTitle = title.trim() || "Untitled Card";
      if (cardTitle.length > 100) {
        return res.status(400).json({
          error: "Card title must be less than 100 characters",
        });
      }
      updateData.title = cardTitle;
    }

    if (fieldTitles !== undefined) {
      if (!Array.isArray(fieldTitles)) {
        return res.status(400).json({
          error: "fieldTitles must be an array",
        });
      }

      if (fieldTitles.length > 11) {
        return res.status(400).json({
          error: "Card cannot have more than 11 fields",
        });
      }

      // Fill missing fields with default titles
      let fields = [...fieldTitles];
      while (fields.length < 11) {
        fields.push(`untitled ${fields.length + 1}`);
      }

      // Validate each field title
      for (let i = 0; i < fields.length; i++) {
        if (typeof fields[i] !== "string") {
          return res.status(400).json({
            error: `Field title at index ${i} must be a string`,
          });
        }
        if (fields[i].trim().length > 100) {
          return res.status(400).json({
            error: `Field title at index ${i} must be less than 100 characters`,
          });
        }
        fields[i] = fields[i].trim() || `untitled ${i + 1}`;
      }

      updateData.fieldTitles = fields;
    }

    if (enabledFields !== undefined) {
      if (!Array.isArray(enabledFields)) {
        return res.status(400).json({
          error: "enabledFields must be an array",
        });
      }
      // Validate and filter enabled fields
      let enabled = enabledFields.filter((idx, pos) => 
        typeof idx === "number" && idx >= 0 && idx <= 9 && enabledFields.indexOf(idx) === pos
      );
      // If no fields enabled, default to all enabled
      if (enabled.length === 0) {
        enabled = Array.from({ length: 10 }, (_, i) => i);
      }
      updateData.enabledFields = enabled;
    }

    const updatedCard = await Card.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("createdBy", "email")
      .populate("assignedClients", "name");

    res.json(updatedCard);
  } catch (err) {
    console.error("Update card error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to update card");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * DELETE /api/cards/:id
 * Delete a card (admin only)
 */
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid card ID format" });
    }

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Delete all card entries associated with this card
    await CardEntry.deleteMany({ cardId: id });

    // Delete the card
    await Card.findByIdAndDelete(id);

    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    console.error("Delete card error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to delete card");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

/**
 * POST /api/cards/:id/assign
 * Assign a card to one or more clients (admin only)
 */
router.post("/:id/assign", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientIds } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid card ID format" });
    }

    if (!Array.isArray(clientIds)) {
      return res.status(400).json({
        error: "clientIds must be an array",
      });
    }

    // Validate all client IDs
    for (const clientId of clientIds) {
      if (!isValidObjectId(clientId)) {
        return res.status(400).json({
          error: `Invalid client ID format: ${clientId}`,
        });
      }
    }

    // Verify card exists
    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Verify all clients exist
    const clients = await Client.find({ _id: { $in: clientIds } });
    if (clients.length !== clientIds.length) {
      return res.status(404).json({
        error: "One or more clients not found",
      });
    }

    // Update card with assigned clients
    card.assignedClients = clientIds;
    await card.save();

    const updatedCard = await Card.findById(id)
      .populate("createdBy", "email")
      .populate("assignedClients", "name");

    res.json(updatedCard);
  } catch (err) {
    console.error("Assign card error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to assign card");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * GET /api/cards/client/:clientId
 * Get all cards assigned to a specific client
 */
router.get("/client/:clientId", auth, async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!isValidObjectId(clientId)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Check if user has access to this client
    const User = (await import("../models/User.js")).default;
    const hasAccess = await hasClientAccess(req.user.id, req.user.role, clientId);
    if (!hasAccess) {
      return res.status(403).json({
        error: "You do not have access to this client",
      });
    }

    const cards = await Card.find({ assignedClients: clientId })
      .populate("createdBy", "email")
      .sort({ createdAt: -1 });

    res.json(cards);
  } catch (err) {
    console.error("Get client cards error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to fetch client cards");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

export default router;

