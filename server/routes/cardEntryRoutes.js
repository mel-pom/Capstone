import express from "express";
import CardEntry from "../models/CardEntry.js";
import Card from "../models/Card.js";
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
 * POST /api/card-entries
 * Create a new card entry (staff can create, admin can unlock)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { cardId, clientId, fieldIndex, value, date, eventDate, eventTime } = req.body;

    // Validate required fields
    // For fieldIndex 10 (date/time field), value is optional
    if (!cardId || clientId === undefined || fieldIndex === undefined) {
      return res.status(400).json({
        error: "cardId, clientId, and fieldIndex are required",
      });
    }
    
    // Value is required for fields 0-9, optional for field 10
    if (fieldIndex !== 10 && !value) {
      return res.status(400).json({
        error: "value is required for fields 0-9",
      });
    }

    // Validate IDs
    if (!isValidObjectId(cardId)) {
      return res.status(400).json({ error: "Invalid card ID format" });
    }

    if (!isValidObjectId(clientId)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Validate fieldIndex
    if (typeof fieldIndex !== "number" || fieldIndex < 0 || fieldIndex > 10) {
      return res.status(400).json({
        error: "fieldIndex must be a number between 0 and 10",
      });
    }

    // Validate value (required for fields 0-9, optional for field 10)
    if (fieldIndex !== 10) {
      if (typeof value !== "string" || value.trim().length === 0) {
        return res.status(400).json({
          error: "Value cannot be empty",
        });
      }

      if (value.length > 5000) {
        return res.status(400).json({
          error: "Value must be less than 5000 characters",
        });
      }
    }

    // Validate eventDate and eventTime for field 10
    let parsedEventDate = null;
    if (fieldIndex === 10) {
      if (eventDate) {
        const [year, month, day] = eventDate.split('-').map(Number);
        parsedEventDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        if (isNaN(parsedEventDate.getTime())) {
          return res.status(400).json({ error: "Invalid eventDate format" });
        }
      }
      
      if (eventTime) {
        // Validate time format (HH:MM)
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(eventTime)) {
          return res.status(400).json({ error: "eventTime must be in HH:MM format" });
        }
      }
    }

    // Verify card exists
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Check if card is assigned to client
    if (!card.assignedClients.some(id => id.toString() === clientId.toString())) {
      return res.status(400).json({
        error: "Card is not assigned to this client",
      });
    }

    // Check if user has access to this client
    const User = (await import("../models/User.js")).default;
    const hasAccess = await hasClientAccess(req.user.id, req.user.role, clientId);
    if (!hasAccess) {
      return res.status(403).json({
        error: "You do not have access to this client",
      });
    }

    // Check if client is active
    if (client.isActive === false) {
      return res.status(400).json({
        error: "Cannot create entry for inactive client",
      });
    }

    // Process date
    let entryDate = new Date();
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      entryDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      if (isNaN(entryDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
    }

    // Check if entry already exists for this field on this date
    const startOfDay = new Date(entryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(entryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingEntry = await CardEntry.findOne({
      cardId,
      clientId,
      fieldIndex,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

      if (existingEntry) {
        // If entry exists and is locked, only admin can update
        if (existingEntry.isLocked && req.user.role !== "admin") {
          return res.status(403).json({
            error: "This field is locked and can only be edited by an administrator",
          });
        }

        // Update existing entry
        if (fieldIndex === 10) {
          // For field 10, update eventDate and eventTime
          if (parsedEventDate) {
            existingEntry.eventDate = parsedEventDate;
          }
          if (eventTime) {
            existingEntry.eventTime = eventTime.trim();
          }
          // Value is optional for field 10
          if (value) {
            existingEntry.value = value.trim();
          }
        } else {
          existingEntry.value = value.trim();
        }
        // Lock after update (staff can update once, then it locks)
        if (req.user.role !== "admin") {
          existingEntry.isLocked = true;
        }
        await existingEntry.save();
        return res.json(existingEntry);
      }

    // Create new entry - locked by default after creation by staff
    const entryData = {
      cardId,
      clientId,
      fieldIndex,
      date: entryDate,
      createdBy: req.user.id,
      isLocked: req.user.role !== "admin" // Lock if created by staff, not locked if created by admin
    };

    if (fieldIndex === 10) {
      // For field 10, set eventDate and eventTime
      if (parsedEventDate) {
        entryData.eventDate = parsedEventDate;
      }
      if (eventTime) {
        entryData.eventTime = eventTime.trim();
      }
      // Value is optional for field 10
      if (value) {
        entryData.value = value.trim();
      }
    } else {
      entryData.value = value.trim();
    }

    const entry = await CardEntry.create(entryData);

    res.status(201).json(entry);
  } catch (err) {
    console.error("Create card entry error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to create card entry");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * GET /api/card-entries/card/:cardId/client/:clientId
 * Get all card entries for a specific card and client
 */
router.get("/card/:cardId/client/:clientId", auth, async (req, res) => {
  try {
    const { cardId, clientId } = req.params;
    const { date } = req.query;

    if (!isValidObjectId(cardId)) {
      return res.status(400).json({ error: "Invalid card ID format" });
    }

    if (!isValidObjectId(clientId)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Verify card exists
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
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

    // Build filter
    const filter = { cardId, clientId };

    // If date is provided, filter by date
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const entryDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      if (isNaN(entryDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      const startOfDay = new Date(entryDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(entryDate);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const entries = await CardEntry.find(filter)
      .populate("createdBy", "email")
      .sort({ fieldIndex: 1, date: -1 });

    res.json(entries);
  } catch (err) {
    console.error("Get card entries error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to fetch card entries");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

/**
 * PUT /api/card-entries/:id
 * Update a card entry (admin only - to unlock fields)
 */
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, isLocked, eventDate, eventTime } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid entry ID format" });
    }

    const entry = await CardEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    // Check if user has access to the entry's client
    const User = (await import("../models/User.js")).default;
    const hasAccess = await hasClientAccess(req.user.id, req.user.role, entry.clientId);
    if (!hasAccess) {
      return res.status(403).json({
        error: "You do not have access to this entry",
      });
    }

    const updateData = {};

    if (value !== undefined) {
      if (entry.fieldIndex === 10) {
        // Value is optional for field 10
        if (value && value.trim().length > 0) {
          updateData.value = value.trim();
        }
      } else {
        if (typeof value !== "string" || value.trim().length === 0) {
          return res.status(400).json({
            error: "Value cannot be empty",
          });
        }
        if (value.length > 5000) {
          return res.status(400).json({
            error: "Value must be less than 5000 characters",
          });
        }
        updateData.value = value.trim();
      }
    }

    if (eventDate !== undefined && entry.fieldIndex === 10) {
      if (eventDate) {
        const [year, month, day] = eventDate.split('-').map(Number);
        const parsedEventDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        if (isNaN(parsedEventDate.getTime())) {
          return res.status(400).json({ error: "Invalid eventDate format" });
        }
        updateData.eventDate = parsedEventDate;
      } else {
        updateData.eventDate = null;
      }
    }

    if (eventTime !== undefined && entry.fieldIndex === 10) {
      if (eventTime) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(eventTime)) {
          return res.status(400).json({ error: "eventTime must be in HH:MM format" });
        }
        updateData.eventTime = eventTime.trim();
      } else {
        updateData.eventTime = null;
      }
    }

    if (isLocked !== undefined) {
      if (typeof isLocked !== "boolean") {
        return res.status(400).json({
          error: "isLocked must be a boolean",
        });
      }
      updateData.isLocked = isLocked;
    }

    const updatedEntry = await CardEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "email");

    res.json(updatedEntry);
  } catch (err) {
    console.error("Update card entry error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to update card entry");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

export default router;

