import express from "express";
import { auth, requireAdmin } from "../middleware/auth.js";
import { getUsers, updateUserRole } from "../controllers/userController.js";
import { isValidObjectId } from "../utils/validateObjectId.js";

const router = express.Router();

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get("/", auth, requireAdmin, getUsers);

/**
 * PATCH /api/users/:id/role
 * Update user role (admin only)
 */
router.patch("/:id/role", auth, requireAdmin, (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  next();
}, updateUserRole);

export default router;
