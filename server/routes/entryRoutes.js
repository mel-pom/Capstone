import express from "express";
import Entry from "../models/Entry.js";
import Client from "../models/Client.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/entries
 * Create a new daily documentation entry for a client
 * @body {string} clientId - MongoDB client ID (required)
 * @body {string} category - Entry category: meals, behavior, outing, medical, notes (required)
 * @body {string} description - Entry description/details (required)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { clientId, category, description } = req.body;

    // Validate required fields
    if (!clientId || !category || !description) {
      return res.status(400).json({
        error: "clientId, category, and description are required"
      });
    }

    // Verify client exists before creating entry
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Create new entry document
    const entry = await Entry.create({
      clientId,
      category,
      description
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("Create entry error:", err);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

/**
 * GET /api/entries/client/:clientId
 * Get entries for a specific client with optional filtering
 * @param {string} clientId - MongoDB client ID
 * @query {string} [category] - Filter by entry category
 * @query {string} [search] - Search in entry descriptions (case-insensitive)
 * @query {string} [startDate] - Filter entries from this date (ISO format)
 * @query {string} [endDate] - Filter entries until this date (ISO format)
 * @returns {Array} List of entries sorted by creation date (newest first)
 */
router.get("/client/:clientId", auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { category, startDate, endDate, search } = req.query;

    // Start with base filter for client ID
    let filter = { clientId };

    // Add category filter if provided
    if (category) {
      filter.category = category;
    }

    // Add text search filter (case-insensitive regex)
    if (search) {
      filter.description = { $regex: search, $options: "i" };
    }

    // Add date range filters
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        // Greater than or equal to start date (beginning of day)
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Less than or equal to end date (end of day)
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = d;
      }
    }

    // Find entries matching filters, sorted by creation date (newest first)
    const entries = await Entry.find(filter)
      .sort({ createdAt: -1 }); // newest first

    res.json(entries);
  } catch (err) {
    console.error("List entries error:", err);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

/**
 * PUT /api/entries/:id
 * Update an existing entry
 * @param {string} id - MongoDB entry ID
 * @body {string} [category] - Updated entry category
 * @body {string} [description] - Updated entry description
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { category, description } = req.body;

    // Update entry and return updated document
    const entry = await Entry.findByIdAndUpdate(
      req.params.id,
      { category, description },
      { new: true, runValidators: true } // Return updated doc and run validators
    );

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(entry);
  } catch (err) {
    console.error("Update entry error:", err);
    res.status(500).json({ error: "Failed to update entry" });
  }
});

/**
 * DELETE /api/entries/:id
 * Delete an entry
 * @param {string} id - MongoDB entry ID
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const entry = await Entry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("Delete entry error:", err);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

export default router;
