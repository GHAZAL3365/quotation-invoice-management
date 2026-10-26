
const { z } = require("zod");

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID");

const quotationItemSchema = z
  .object({
    description: z.string().trim().min(1).max(500),
    quantity: z.number().positive(),
    rate: z.number().min(0),
  })
  .strict();

const createQuotationSchema = z
  .object({
    clientId: objectId,
    quotationDate: z.coerce.date(),
    validUntil: z.coerce.date(),
    items: z.array(quotationItemSchema).min(
      1,
      "At least one quotation item is required"
    ),
    discount: z.number().min(0).default(0),
    taxRate: z.number().min(0).max(100).default(0),
    notes: z.string().trim().max(2000).optional().default(""),
  })
  .strict()
  .refine(
    (data) => data.validUntil >= data.quotationDate,
    {
      path: ["validUntil"],
      message: "Validity date cannot be before quotation date",
    }
  );

const updateQuotationSchema = z
  .object({
    clientId: objectId.optional(),
    quotationDate: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    items: z.array(quotationItemSchema).min(1).optional(),
    discount: z.number().min(0).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
    status: z
      .enum(["Draft", "Sent", "Accepted", "Rejected", "Expired"])
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  })
  .refine(
    (data) =>
      !data.quotationDate ||
      !data.validUntil ||
      data.validUntil >= data.quotationDate,
    {
      path: ["validUntil"],
      message: "Validity date cannot be before quotation date",
    }
  );

const quotationIdSchema = z.object({
  id: objectId,
});

const listQuotationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    clientId: objectId.optional(),
    status: z
      .enum(["Draft", "Sent", "Accepted", "Rejected", "Expired"])
      .optional(),
    search: z.string().trim().max(100).optional(),
  })
  .strict();

module.exports = {
  createQuotationSchema,
  updateQuotationSchema,
  quotationIdSchema,
  listQuotationsQuerySchema,
};
