import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Client from "../models/Client.js";

// Load environment variables
dotenv.config();

/**
 * Script to list all users in the database
 */
async function listUsers() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!\n");

    // Fetch all users, excluding password field and populating assigned clients
    const users = await User.find({})
      .select("-password")
      .populate("assignedClients", "name")
      .sort({ email: 1 });

    // Display results
    if (users.length === 0) {
      console.log("No users found in the database.");
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      console.log("=".repeat(80));
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        
        if (user.assignedClients && user.assignedClients.length > 0) {
          const clientNames = user.assignedClients
            .map(client => typeof client === 'object' ? client.name : 'Unknown')
            .join(", ");
          console.log(`   Assigned Clients: ${clientNames}`);
        } else {
          console.log(`   Assigned Clients: None`);
        }
        
        console.log(`   Created: ${user.createdAt || 'N/A'}`);
      });
      
      console.log("\n" + "=".repeat(80));
      
      // Summary
      const adminCount = users.filter(u => u.role === "admin").length;
      const staffCount = users.filter(u => u.role === "staff").length;
      console.log(`\nSummary:`);
      console.log(`  - Total Users: ${users.length}`);
      console.log(`  - Admins: ${adminCount}`);
      console.log(`  - Staff: ${staffCount}`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error listing users:", error);
    process.exit(1);
  }
}

// Run the script
listUsers();

