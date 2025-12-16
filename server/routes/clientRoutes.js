import express from "express";
import Client from "../models/Client.js";
import { auth, requireAdmin } from "../middleware/auth.js";
import { isValidObjectId } from "../utils/validateObjectId.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

const router = express.Router();

/**
 * POST /api/clients
 * Create a new client (admin only)
 */
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { name, photo, enabledCategories, notes } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Client name is required" });
    }

    // Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({
        error: "Client name must be at least 2 characters long",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        error: "Client name must be less than 100 characters",
      });
    }

    // Validate enabledCategories if provided
    if (enabledCategories !== undefined) {
      if (!Array.isArray(enabledCategories)) {
        return res.status(400).json({
          error: "enabledCategories must be an array",
        });
      }

      const validCategories = ["meals", "behavior", "outing", "medical", "notes"];
      const invalidCategories = enabledCategories.filter(
        (cat) => !validCategories.includes(cat)
      );

      if (invalidCategories.length > 0) {
        return res.status(400).json({
          error: `Invalid categories: ${invalidCategories.join(", ")}. Valid categories are: ${validCategories.join(", ")}`,
        });
      }

      if (enabledCategories.length === 0) {
        return res.status(400).json({
          error: "At least one category must be enabled",
        });
      }
    }

    // Validate notes length if provided
    if (notes && notes.length > 1000) {
      return res.status(400).json({
        error: "Notes must be less than 1000 characters",
      });
    }

    const client = await Client.create({
      name: name.trim(),
      photo: photo || "",
      enabledCategories: enabledCategories || [
        "meals",
        "behavior",
        "outing",
        "medical",
        "notes",
      ],
      notes: notes ? notes.trim() : "",
    });

    res.status(201).json(client);
  } catch (err) {
    console.error("Create client error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to create client");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * GET /api/clients
 * Get all clients (staff + admin)
 */
router.get("/", auth, async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    console.error("List clients error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to fetch clients");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

/**
 * GET /api/clients/:id
 * Get a single client by ID
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (err) {
    console.error("Get client error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to fetch client");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

/**
 * PUT /api/clients/:id
 * Update client (admin only)
 */
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    const { name, photo, enabledCategories, notes, isActive } = req.body;

    // Validate name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Client name cannot be empty" });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({
          error: "Client name must be at least 2 characters long",
        });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({
          error: "Client name must be less than 100 characters",
        });
      }
    }

    // Validate enabledCategories if provided
    if (enabledCategories !== undefined) {
      if (!Array.isArray(enabledCategories)) {
        return res.status(400).json({
          error: "enabledCategories must be an array",
        });
      }

      const validCategories = ["meals", "behavior", "outing", "medical", "notes"];
      const invalidCategories = enabledCategories.filter(
        (cat) => !validCategories.includes(cat)
      );

      if (invalidCategories.length > 0) {
        return res.status(400).json({
          error: `Invalid categories: ${invalidCategories.join(", ")}. Valid categories are: ${validCategories.join(", ")}`,
        });
      }

      if (enabledCategories.length === 0) {
        return res.status(400).json({
          error: "At least one category must be enabled",
        });
      }
    }

    // Validate notes if provided
    if (notes !== undefined && notes.length > 1000) {
      return res.status(400).json({
        error: "Notes must be less than 1000 characters",
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (photo !== undefined) updateData.photo = photo;
    if (enabledCategories !== undefined) updateData.enabledCategories = enabledCategories;
    if (notes !== undefined) updateData.notes = notes.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const client = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (err) {
    console.error("Update client error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to update client");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete client (admin only)
 */
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Client deleted" });
  } catch (err) {
    console.error("Delete client error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to delete client");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

export default router;
