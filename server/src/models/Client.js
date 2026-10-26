const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      minlength: [2, "Client name must be at least 2 characters"],
      maxlength: [100, "Client name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [25, "Phone cannot exceed 25 characters"],
    },

    billingAddress: {
      type: String,
      trim: true,
      maxlength: [500, "Billing address cannot exceed 500 characters"],
    },

    taxId: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [50, "Tax ID cannot exceed 50 characters"],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Client", clientSchema);