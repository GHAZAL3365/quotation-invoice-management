const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");

const createPayment = async (invoiceId, paymentData) => {
  const executePayment = async (session = null) => {
    const query = Invoice.findOne({
      _id: invoiceId,
      isDeleted: { $ne: true },
    });
    if (session && typeof query.session === "function") {
      query.session(session);
    }
    const invoice = await query;

    if (!invoice) {
      const error = new Error("Invoice not found");
      error.statusCode = 404;
      throw error;
    }

    const total = Number(invoice.total);
    const paidAmount = Number(invoice.paidAmount || 0);
    const amount = Number(paymentData.amount);

    const outstanding = Number((total - paidAmount).toFixed(2));

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(paidAmount) ||
      total <= 0 ||
      paidAmount < 0
    ) {
      const error = new Error("Invoice amounts are invalid");
      error.statusCode = 400;
      throw error;
    }

    if (amount > outstanding + 0.000001) {
      const error = new Error(
        `Payment exceeds outstanding balance of ${outstanding.toFixed(2)}`
      );
      error.statusCode = 400;
      throw error;
    }

    const newPaidAmount = Number((paidAmount + amount).toFixed(2));

    const payment = await Payment.create({
      invoice: invoice._id,
      amount: amount,
      paymentDate: paymentData.paymentDate || new Date(),
      paymentMethod: paymentData.paymentMethod || "Bank Transfer",
      reference: paymentData.reference || "",
      notes: paymentData.notes || "",
    });

    invoice.paidAmount = newPaidAmount;

    if (newPaidAmount >= total - 0.000001) {
      invoice.paidAmount = total;
      invoice.status = "Paid";
    } else if (newPaidAmount > 0) {
      invoice.status = "Partially Paid";
    } else {
      invoice.status = "Unpaid";
    }

    if (typeof invoice.save === "function") {
      await invoice.save(session ? { session } : undefined);
    } else {
      await Invoice.findByIdAndUpdate(invoice._id, {
        paidAmount: invoice.paidAmount,
        status: invoice.status,
      });
    }

    return Array.isArray(payment) ? payment[0] : payment;
  };

  if (mongoose.connection.readyState === 1 && typeof mongoose.startSession === "function") {
    try {
      const session = await mongoose.startSession();
      try {
        let result;
        await session.withTransaction(async () => {
          result = await executePayment(session);
        });
        return result;
      } finally {
        await session.endSession();
      }
    } catch {
      return executePayment(null);
    }
  }

  return executePayment(null);
};

const getInvoicePayments = async (invoiceId, { page = 1, limit = 10 }) => {
  const invoice = await Invoice.findOne({
    _id: invoiceId,
    isDeleted: { $ne: true },
  });

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  const filter = { invoice: invoiceId };
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPayments = async ({ page = 1, limit = 10, invoiceId } = {}) => {
  const filter = {};

  if (invoiceId) {
    filter.invoice = invoiceId;
  }

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("invoice")
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createPayment,
  getInvoicePayments,
  getPayments,
};
