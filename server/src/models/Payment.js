
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Invoice is required"],
      index: true,
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Payment amount is required"],
      validate: {
        validator: (value) =>
          value != null && Number(value.toString()) > 0,
        message: "Payment amount must be greater than zero",
      },
    },

    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: {
        values: ["Cash", "Bank Transfer", "UPI", "Cheque", "Other"],
        message: "Invalid payment method",
      },
      required: [true, "Payment method is required"],
    },

    reference: {
      type: String,
      trim: true,
      maxlength: [100, "Reference cannot exceed 100 characters"],
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ invoice: 1, paymentDate: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
