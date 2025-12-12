import express from "express";
import Client from "../models/Client.js";
import { auth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/clients
 * Create a new client (admin only)
 * @body {string} name - Client name (required)
 * @body {string} [photo] - Client photo URL
 * @body {string[]} [enabledCategories] - Array of enabled entry categories
 * @body {string} [notes] - Additional notes about the client
 */
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { name, photo, enabledCategories, notes } = req.body;

    // Validate required field
    if (!name) {
      return res.status(400).json({ error: "Client name is required" });
    }

    // Create new client document
    const client = await Client.create({
      name,
      photo,
      enabledCategories,
      notes
    });

    res.status(201).json(client);
  } catch (err) {
    console.error("Create client error:", err);
    res.status(500).json({ error: "Failed to create client" });
  }
});

/**
 * GET /api/clients
 * Get all clients (staff + admin)
 * Returns list of all clients sorted alphabetically by name
 */
router.get("/", auth, async (req, res) => {
  try {
    // Find all clients and sort by name ascending
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    console.error("List clients error:", err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

/**
 * GET /api/clients/:id
 * Get a single client by ID
 * @param {string} id - MongoDB client ID
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (err) {
    console.error("Get client error:", err);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

/**
 * PUT /api/clients/:id
 * Update client information (admin only)
 * @param {string} id - MongoDB client ID
 * @body {string} [name] - Updated client name
 * @body {string} [photo] - Updated photo URL
 * @body {string[]} [enabledCategories] - Updated enabled categories
 * @body {string} [notes] - Updated notes
 * @body {boolean} [isActive] - Client active status
 */
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { name, photo, enabledCategories, notes, isActive } = req.body;

    // Update client and return updated document
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, photo, enabledCategories, notes, isActive },
      { new: true, runValidators: true } // Return updated doc and run validators
    );

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (err) {
    console.error("Update client error:", err);
    res.status(500).json({ error: "Failed to update client" });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client (admin only)
 * @param {string} id - MongoDB client ID
 */
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Client deleted" });
  } catch (err) {
    console.error("Delete client error:", err);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
