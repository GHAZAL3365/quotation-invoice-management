const { z } = require("zod");

const createClientSchema = z
  .object({
    clientName: z
      .string()
      .trim()
      .min(2, "Client name must be at least 2 characters")
      .max(100, "Client name cannot exceed 100 characters"),

    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .max(254, "Email cannot exceed 254 characters")
      .transform((value) => value.toLowerCase()),

    phone: z
      .string()
      .trim()
      .max(25, "Phone cannot exceed 25 characters")
      .optional(),

    billingAddress: z
      .string()
      .trim()
      .max(500, "Billing address cannot exceed 500 characters")
      .optional(),

    taxId: z
      .string()
      .trim()
      .max(50, "Tax ID cannot exceed 50 characters")
      .transform((value) => value.toUpperCase())
      .optional(),

    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional(),
  })
  .strict();

const clientIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid client ID"),
});


const listClientsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).default(""),
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  })
  .strict();

  
  const updateClientSchema = createClientSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required to update",
    }
  );



module.exports = {
  createClientSchema,
  clientIdSchema,
  listClientsQuerySchema,
  updateClientSchema
};