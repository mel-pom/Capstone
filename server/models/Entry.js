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
      enum: ["meals", "behavior", "medical", "notes"],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },

  },
  {
    timestamps: true // gives createdAt + updatedAt
  }
);

const Entry = mongoose.model("Entry", entrySchema);

export default Entry;
