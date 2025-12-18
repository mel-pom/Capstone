import User from "../models/User.js";
import Client from "../models/Client.js";
import { formatErrorResponse } from "../utils/errorHandler.js";
import { isValidObjectId } from "../utils/validateObjectId.js";

/**
 * GET /api/users
 * Get all users (admin only)
 * Returns list of users with their email, role, and assigned clients (password excluded)
 */
export const getUsers = async (req, res) => {
  try {
    // Fetch all users with assigned clients populated, excluding password field
    const users = await User.find({})
      .select("-password")
      .populate("assignedClients", "name photo")
      .sort({ email: 1 });

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

    // Find the user first to check current role
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare update data
    const updateData = { role };

    // If changing to admin, clear assignedClients (admins have access to all clients)
    // If changing from admin to staff, keep assignedClients as is (or empty if it was never set)
    if (role === "admin" && user.role !== "admin") {
      updateData.assignedClients = [];
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update user role error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to update user role");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
};

/**
 * PATCH /api/users/:id/clients
 * Update assigned clients for a user (admin only)
 * @param {string} id - User ID
 * @body {string[]} clientIds - Array of client IDs to assign to the user
 */
export const updateAssignedClients = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientIds } = req.body;

    // Validate clientIds is an array
    if (!Array.isArray(clientIds)) {
      return res.status(400).json({
        error: "clientIds must be an array",
      });
    }

    // Validate all client IDs are valid ObjectIds
    const invalidIds = clientIds.filter((clientId) => !isValidObjectId(clientId));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: `Invalid client IDs: ${invalidIds.join(", ")}`,
      });
    }

    // Find the user first to check their role
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent assigning clients to admins (admins have access to all clients by default)
    if (user.role === "admin") {
      return res.status(400).json({
        error: "Cannot assign clients to admin users. Admins have access to all clients by default.",
      });
    }

    // Verify all clients exist
    const clients = await Client.find({ _id: { $in: clientIds } });
    if (clients.length !== clientIds.length) {
      const foundIds = clients.map((c) => c._id.toString());
      const missingIds = clientIds.filter((id) => !foundIds.includes(id));
      return res.status(404).json({
        error: `Clients not found: ${missingIds.join(", ")}`,
      });
    }

    // Update user's assigned clients
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { assignedClients: clientIds },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("assignedClients", "name photo");

    res.json({
      message: "Assigned clients updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update assigned clients error:", err);
    const errorResponse = formatErrorResponse(err, "Failed to update assigned clients");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
};
