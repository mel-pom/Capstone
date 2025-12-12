import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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

    // Check if user with this email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user (password will be hashed by User model)
    const user = await User.create({ email, password, role });

    res.status(201).json({
      message: "User registered",
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
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

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify password using bcrypt comparison
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
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
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
