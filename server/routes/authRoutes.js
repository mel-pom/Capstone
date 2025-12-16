import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 * @body {string} email - User email address
 * @body {string} password - User password (will be hashed)
 * @body {string} [role] - Optional user role (defaults to 'staff')
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        error: "Password must be less than 128 characters",
      });
    }

    // Validate role if provided
    if (role && !["staff", "admin"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Must be 'staff' or 'admin'",
      });
    }

    // Check if user with this email already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Create new user (password will be hashed by User model)
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      role: role || "staff",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Register error:", err);
    const errorResponse = formatErrorResponse(err, "Registration failed");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(errorResponse.errors && { errors: errorResponse.errors }),
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * @body {string} email - User email address
 * @body {string} password - User password
 * @returns {Object} token and user info
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password using bcrypt comparison
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token with user ID and role, expires in 7 days
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Login error:", err);
    const errorResponse = formatErrorResponse(err, "Login failed");
    res.status(errorResponse.status).json({
      error: errorResponse.message,
    });
  }
});

export default router;
