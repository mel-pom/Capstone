import mongoose from "mongoose";
import dotenv from "dotenv";

// Set test environment
process.env.NODE_ENV = "test";

// Load environment variables
dotenv.config();

// Set test database connection
const TEST_MONGO_URI = process.env.TEST_MONGO_URI || process.env.MONGO_URI;

// Export connection function for use in tests
export async function connectTestDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
      console.log("Connected to test database");
    }
  } catch (error) {
    console.error("Test database connection error:", error);
    throw error;
  }
}

// Export disconnect function
export async function disconnectTestDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("Test database connection closed");
    }
  } catch (error) {
    console.error("Error closing test database:", error);
  }
}

