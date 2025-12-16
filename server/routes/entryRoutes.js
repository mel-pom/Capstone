import express from "express";
import Entry from "../models/Entry.js";
import Client from "../models/Client.js";
import { auth } from "../middleware/auth.js";
import { isValidObjectId } from "../utils/validateObjectId.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

const router = express.Router();

/**
 * POST /api/entries
 * Create a new entry for a client
 */
router.post("/", auth, async (req, res) => {
  try {
    const { clientId, category, description } = req.body;

    // Validate required fields
    if (!clientId || !category || !description) {
      return res.status(400).json({
        error: "clientId, category, and description are required",
      });
    }

    // Validate clientId format
    if (!isValidObjectId(clientId)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Validate category
    const validCategories = ["meals", "behavior", "outing", "medical", "notes"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      });
    }

    // Validate description length
    if (description.trim().length === 0) {
      return res.status(400).json({ error: "Description cannot be empty" });
    }

    if (description.length > 5000) {
      return res.status(400).json({
        error: "Description must be less than 5000 characters",
      });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Check if client is active
    if (client.isActive === false) {
      return res.status(400).json({
        error: "Cannot create entry for inactive client",
      });
    }

    const entry = await Entry.create({
      clientId,
      category,
      description: description.trim(),
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("Create entry error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to create entry");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * GET /api/entries/client/:clientId
 * Get entries for a client, with optional filters:
 * ?category=behavior&startDate=2025-12-01&endDate=2025-12-03&search=meltdown
 */
router.get("/client/:clientId", auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { category, startDate, endDate, search } = req.query;

    if (!isValidObjectId(clientId)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    let filter = { clientId };

    // Validate and apply category filter
    if (category) {
      const validCategories = ["meals", "behavior", "outing", "medical", "notes"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: `Invalid category filter. Must be one of: ${validCategories.join(", ")}`,
        });
      }
      filter.category = category;
    }

    // Validate and apply search filter
    if (search) {
      if (search.trim().length === 0) {
        return res.status(400).json({ error: "Search term cannot be empty" });
      }
      filter.description = { $regex: search.trim(), $options: "i" };
    }

    // Validate and apply date filters
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ error: "Invalid start date format" });
        }
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ error: "Invalid end date format" });
        }
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
      // Validate date range
      if (startDate && endDate && filter.createdAt.$gte > filter.createdAt.$lte) {
        return res.status(400).json({
          error: "Start date must be before or equal to end date",
        });
      }
    }

    const entries = await Entry.find(filter).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    console.error("List entries error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to fetch entries");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

/**
 * PUT /api/entries/:id
 * Update an entry
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid entry ID format" });
    }

    const { category, description } = req.body;

    // Validate at least one field is provided
    if (category === undefined && description === undefined) {
      return res.status(400).json({
        error: "At least one field (category or description) must be provided",
      });
    }

    // Validate category if provided
    if (category !== undefined) {
      const validCategories = ["meals", "behavior", "outing", "medical", "notes"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        });
      }
    }

    // Validate description if provided
    if (description !== undefined) {
      if (description.trim().length === 0) {
        return res.status(400).json({ error: "Description cannot be empty" });
      }
      if (description.length > 5000) {
        return res.status(400).json({
          error: "Description must be less than 5000 characters",
        });
      }
    }

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description.trim();

    const entry = await Entry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(entry);
  } catch (err) {
    console.error("Update entry error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to update entry");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * DELETE /api/entries/:id
 * Delete an entry
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid entry ID format" });
    }

    const entry = await Entry.findByIdAndDelete(id);

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    console.error("Delete entry error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to delete entry");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

export default router;
