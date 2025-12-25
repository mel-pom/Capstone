import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import { auth } from "./middleware/auth.js";
import clientRoutes from "./routes/clientRoutes.js";
import entryRoutes from "./routes/entryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import cardEntryRoutes from "./routes/cardEntryRoutes.js";
import { formatErrorResponse } from "./utils/errorHandler.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
// Use PORT from environment or default to 5000
const PORT = process.env.PORT || 5000;

// ============ Middleware ============
// Enable CORS to allow cross-origin requests from frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL, // set this in Render after you know the UI URL
].filter(Boolean);

// Log allowed origins for debugging
console.log("CORS allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
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

// ====== USER ROUTES (ADMIN ONLY - GET ALL USERS, UPDATE ROLE) ======
app.use("/api/users", userRoutes);

// ====== CARD ROUTES (ADMIN ONLY - CREATE, READ, UPDATE, DELETE, ASSIGN) ======
app.use("/api/cards", cardRoutes);

// ====== CARD ENTRY ROUTES (STAFF CAN CREATE, ADMIN CAN UNLOCK) ======
app.use("/api/card-entries", cardEntryRoutes);

// ====== CARD ROUTES (ADMIN ONLY - CREATE, READ, UPDATE, DELETE, ASSIGN) ======
app.use("/api/cards", cardRoutes);

// ====== CARD ENTRY ROUTES (STAFF CAN CREATE, ADMIN CAN UNLOCK) ======
app.use("/api/card-entries", cardEntryRoutes);

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
  const errorResponse = formatErrorResponse(err, "Internal server error");
  res.status(errorResponse.status).json({
    error: errorResponse.message,
    ...(errorResponse.errors && { errors: errorResponse.errors }),
  });
});

// Export app for testing
export default app;

// ============ MongoDB Connection ============
// Connect to MongoDB database using connection string from environment
// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      // Start Express server on specified port
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.error("MongoDB connection error:", err));
}
