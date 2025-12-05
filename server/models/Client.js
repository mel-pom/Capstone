import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    photo: {
      type: String, 
      default: ""
    },
    enabledCategories: {
      type: [String],
      default: ["meals", "behavior", "outing", "medical", "notes"]
    },
    notes: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // adds createdAt + updatedAt automatically
  }
);

const Client = mongoose.model("Client", clientSchema);

export default Client;
