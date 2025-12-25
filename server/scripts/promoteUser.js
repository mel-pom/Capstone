import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

/**
 * Script to promote a user to admin role
 * Usage: node scripts/promoteUser.js <userId>
 */
async function promoteUser(userId) {
  try {
    if (!userId) {
      console.error("Error: User ID is required");
      console.log("Usage: node scripts/promoteUser.js <userId>");
      process.exit(1);
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!\n");

    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`Error: User with ID ${userId} not found.`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Check if user is already admin
    if (user.role === "admin") {
      console.log(`User ${user.email} is already an admin.`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Update user role to admin and clear assignedClients
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        role: "admin",
        assignedClients: [] // Admins have access to all clients
      },
      { new: true, runValidators: true }
    ).select("-password");

    console.log("✅ User promoted to admin successfully!\n");
    console.log("Updated user details:");
    console.log(`  - ID: ${updatedUser._id}`);
    console.log(`  - Email: ${updatedUser.email}`);
    console.log(`  - Role: ${updatedUser.role}`);
    console.log(`  - Assigned Clients: None (admins have access to all clients)`);

    // Close connection
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error promoting user:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];
promoteUser(userId);

