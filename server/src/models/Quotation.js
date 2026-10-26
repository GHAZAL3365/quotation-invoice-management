
const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.000001,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    quotationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    items: {
      type: [quotationItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one quotation item is required",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Draft", "Sent", "Accepted", "Rejected", "Expired"],
      default: "Draft",
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

quotationSchema.index({
  isDeleted: 1,
  quotationDate: -1,
});

quotationSchema.index({
  clientId: 1,
  isDeleted: 1,
  quotationDate: -1,
});

module.exports = mongoose.model("Quotation", quotationSchema);
