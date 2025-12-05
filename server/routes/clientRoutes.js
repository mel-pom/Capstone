import express from "express";
import Client from "../models/Client.js";
import { auth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST - Create a new client (admin only)
 */
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { name, photo, enabledCategories, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Client name is required" });
    }

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
 * GET - Get all clients (staff + admin)
 */
router.get("/", auth, async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    console.error("List clients error:", err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

/**
 * Get a single client by ID
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
 * PUT - Update client (admin only)
 */
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { name, photo, enabledCategories, notes, isActive } = req.body;

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, photo, enabledCategories, notes, isActive },
      { new: true, runValidators: true }
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
 * DELETE - Delete client (admin only)
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
