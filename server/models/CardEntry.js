import mongoose from "mongoose";

const cardEntrySchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    fieldIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    value: {
      type: String,
      required: function() {
        // Value is required for fields 0-9, optional for field 10 (date/time field)
        return this.fieldIndex !== 10;
      },
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    eventDate: {
      type: Date,
      // Optional date for field 10 (date/time field)
    },
    eventTime: {
      type: String,
      // Optional time string (HH:MM format) for field 10
      trim: true
    },
    isLocked: {
      type: Boolean,
      default: false
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

// Index to ensure one entry per field per day per card per client
cardEntrySchema.index({ cardId: 1, clientId: 1, fieldIndex: 1, date: 1 }, { unique: true });

const CardEntry = mongoose.model("CardEntry", cardEntrySchema);

export default CardEntry;

