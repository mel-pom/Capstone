import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    category: {
      type: String,
      enum: ["meals", "behavior", "outing", "medical", "notes"],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: undefined // Only set if provided
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snacks"],
      required: function() {
        return this.category === "meals";
      }
    }
  },
  {
    timestamps: true // gives createdAt + updatedAt
  }
);

const Entry = mongoose.model("Entry", entrySchema);

export default Entry;
