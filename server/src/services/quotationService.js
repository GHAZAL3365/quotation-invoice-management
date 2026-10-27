
const mongoose = require("mongoose");
const Quotation = require("../models/Quotation");
const QuotationCounter = require("../models/QuotationCounter");
const Client = require("../models/Client");

const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function generateQuotationNumber() {
  const year = new Date().getFullYear();
  const counterId = `QUO-${year}`;

  const counter = await QuotationCounter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `QUO-${year}-${String(counter.sequence).padStart(4, "0")}`;
}

async function validateClient(clientId) {
  if (!mongoose.isValidObjectId(clientId)) {
    throw new AppError("Invalid client ID", 400);
  }

  const client = await Client.findOne({
    _id: clientId,
    isActive: true,
    isDeleted: { $ne: true },
  }).select("_id");

  if (!client) {
    throw new AppError("Active client not found", 404);
  }
}

function calculateTotals(data) {
  const items = data.items.map((item) => ({
    description: item.description.trim(),
    quantity: Number(item.quantity),
    rate: Number(item.rate),
    amount: roundMoney(Number(item.quantity) * Number(item.rate)),
  }));

  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.amount, 0)
  );

  const discount = Number(data.discount ?? 0);
  const taxRate = Number(data.taxRate ?? 0);

  if (discount > subtotal) {
    throw new AppError("Discount cannot exceed the subtotal", 400);
  }

  const taxableAmount = roundMoney(subtotal - discount);
  const taxAmount = roundMoney(taxableAmount * (taxRate / 100));
  const total = roundMoney(taxableAmount + taxAmount);

  return {
    items,
    subtotal,
    discount,
    taxRate,
    taxAmount,
    total,
  };
}

async function createQuotation(data) {
  await validateClient(data.clientId);

  const quotationNumber = await generateQuotationNumber();
  const totals = calculateTotals(data);

  return Quotation.create({
    ...data,
    quotationNumber,
    ...totals,
    status: "Draft",
  });
}

async function getQuotations({
  page = 1,
  limit = 10,
  clientId,
  status,
  search,
}) {
  const filter = { isDeleted: false };

  if (clientId) {
    if (!mongoose.isValidObjectId(clientId)) {
      throw new AppError("Invalid client ID", 400);
    }

    filter.clientId = clientId;
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    const matchingClients = await Client.find({
      $or: [
        { clientName: searchRegex },
        { email: searchRegex },
      ],
    }).distinct("_id");

    filter.$or = [
      { quotationNumber: searchRegex },
      { clientId: { $in: matchingClients } },
    ];
  }

  const skip = (page - 1) * limit;

  const [quotations, total] = await Promise.all([
    Quotation.find(filter)
      .populate("clientId", "clientName email phone billingAddress taxId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Quotation.countDocuments(filter),
  ]);

  return {
    quotations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getQuotationById(id, clientId) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid quotation ID", 400);
  }

  const filter = {
    _id: id,
    isDeleted: false,
  };

  if (clientId) {
    filter.clientId = clientId;
  }

  const quotation = await Quotation.findOne(filter).populate(
    "clientId",
    "clientName email phone billingAddress taxId"
  );

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  return quotation;
}

async function updateQuotation(id, data) {
  const quotation = await getQuotationById(id);

  if (["Accepted", "Rejected"].includes(quotation.status)) {
    throw new AppError(
      "Accepted or rejected quotations cannot be edited",
      409
    );
  }

  const merged = {
    clientId: data.clientId ?? quotation.clientId._id,
    quotationDate: data.quotationDate ?? quotation.quotationDate,
    validUntil: data.validUntil ?? quotation.validUntil,
    items: data.items ?? quotation.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
    })),
    discount: data.discount ?? quotation.discount,
    taxRate: data.taxRate ?? quotation.taxRate,
    notes: data.notes ?? quotation.notes,
  };

  if (merged.validUntil < merged.quotationDate) {
    throw new AppError(
      "Validity date cannot be before quotation date",
      400
    );
  }

  if (data.clientId) {
    await validateClient(data.clientId);
  }

  const totals = calculateTotals(merged);

  Object.assign(quotation, merged, totals);

  if (data.status !== undefined) {
    quotation.status = data.status;
  }

  await quotation.save();

  return getQuotationById(quotation._id);
}

async function deleteQuotation(id) {
  const quotation = await getQuotationById(id);

  if (quotation.status === "Accepted") {
    throw new AppError(
      "Accepted quotations cannot be deleted",
      409
    );
  }

  quotation.isDeleted = true;
  await quotation.save();

  return { id: quotation._id };
}

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  generateQuotationNumber,
};
