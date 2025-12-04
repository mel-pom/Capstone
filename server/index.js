import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import { auth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ Middleware ============
app.use(cors());
app.use(express.json());

// ============ Test Route ============
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// ====== AUTH ROUTES (REGISTER + LOGIN) ======
app.use("/api/auth", authRoutes);

// ====== PROTECTED TEST ROUTE ======
app.get("/api/secret", auth, (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user
  });
});

// ============ MongoDB Connection ============
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
