
const { z } = require("zod");

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID");

const createPaymentSchema = z
  .object({
    amount: z.coerce
      .number()
      .finite()
      .positive()
      .max(999999999999.99)
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
        "Payment amount can have at most 2 decimal places"
      ),

    paymentDate: z.coerce.date().optional(),

    paymentMethod: z.enum([
      "Cash",
      "Bank Transfer",
      "UPI",
      "Cheque",
      "Other",
    ]),

    reference: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

const paymentIdParamsSchema = z.object({
  id: objectIdSchema,
}).strict();

const listPaymentsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    invoiceId: objectIdSchema.optional(),
  })
  .strict();

module.exports = {
  createPaymentSchema,
  paymentIdParamsSchema,
  listPaymentsQuerySchema,
};
