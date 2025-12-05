import express from "express";
import Entry from "../models/Entry.js";
import Client from "../models/Client.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST - Create a new entry for a client
 */
router.post("/", auth, async (req, res) => {
  try {
    const { clientId, category, description } = req.body;

    if (!clientId || !category || !description) {
      return res.status(400).json({
        error: "clientId, category, and description are required"
      });
    }

    // verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

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
 * GET Get entries for a client
 */
router.get("/client/:clientId", auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { category, startDate, endDate, search } = req.query;

    let filter = { clientId };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.description = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // end of day
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = d;
      }
    }

    const entries = await Entry.find(filter)
      .sort({ createdAt: -1 }); // newest first

    res.json(entries);
  } catch (err) {
    console.error("List entries error:", err);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

/**
 * PUT - Update an entry
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { category, description } = req.body;

    const entry = await Entry.findByIdAndUpdate(
      req.params.id,
      { category, description },
      { new: true, runValidators: true }
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
 * Delete an entry
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
