import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Card"
    },
    fieldTitles: {
      type: [String],
      default: function() {
        // Default to "untitled 1", "untitled 2", etc. up to 11 fields (0-10)
        return Array.from({ length: 11 }, (_, i) => `untitled ${i + 1}`);
      },
      validate: {
        validator: function(v) {
          return v.length <= 11;
        },
        message: "Card cannot have more than 11 fields"
      }
    },
    enabledFields: {
      type: [Number],
      default: function() {
        // Default to all fields enabled (0-10)
        return Array.from({ length: 11 }, (_, i) => i);
      },
      validate: {
        validator: function(v) {
          // All values must be between 0 and 10
          return v.every(fieldIndex => fieldIndex >= 0 && fieldIndex <= 10);
        },
        message: "Field indices must be between 0 and 10"
      }
    },
    assignedClients: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Client",
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Card = mongoose.model("Card", cardSchema);

export default Card;

