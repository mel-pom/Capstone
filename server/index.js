import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import { auth } from "./middleware/auth.js";
import clientRoutes from "./routes/clientRoutes.js";
import entryRoutes from "./routes/entryRoutes.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
// Use PORT from environment or default to 5000
const PORT = process.env.PORT || 5000;

// ============ Middleware ============
// Enable CORS to allow cross-origin requests from frontend
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// ============ Test Route ============
// Health check endpoint to verify API is running
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// ====== AUTH ROUTES (REGISTER + LOGIN) ======
app.use("/api/auth", authRoutes);

// ====== CLIENT ROUTES (CREATE, READ, UPDATE, DELETE) ======
app.use("/api/clients", clientRoutes);

// ====== ENTRY ROUTES (CREATE, READ, UPDATE, DELETE) ======
app.use("/api/entries", entryRoutes);

// ====== PROTECTED TEST ROUTE ======
app.get("/api/secret", auth, (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user
  });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

// ============ MongoDB Connection ============
// Connect to MongoDB database using connection string from environment
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    // Start Express server on specified port
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
