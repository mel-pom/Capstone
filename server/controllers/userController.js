import User from "../models/User.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

/**
 * GET /api/users
 * Get all users (admin only)
 * Returns list of users with their email and role (password excluded)
 */
export const getUsers = async (req, res) => {
  try {
    // Fetch all users, excluding password field
    const users = await User.find({}).select("-password").sort({ email: 1 });

    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to fetch users");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
};

/**
 * PATCH /api/users/:id/role
 * Update user role (admin only)
 * @param {string} id - User ID
 * @body {string} role - New role ('staff' or 'admin')
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !["staff", "admin"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Must be 'staff' or 'admin'",
      });
    }

    // Prevent admin from changing their own role
    // Compare as strings since JWT stores id as string and route param is also string
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({
        error: "You cannot change your own role",
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User role updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update user role error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to update user role");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
};
